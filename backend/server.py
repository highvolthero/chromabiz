import google.generativeai as genai
from fastapi import FastAPI, APIRouter, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

import json
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# In-memory rate limiting storage
rate_limits: Dict[str, Dict[str, Any]] = {}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class PaletteGenerationRequest(BaseModel):
    business_name: str
    business_category: str
    target_country: str
    age_groups: List[str]
    target_gender: str
    brand_values: Optional[str] = ""
    competitors: Optional[str] = ""


class Color(BaseModel):
    hex: str
    name: str
    usage: str


class Palette(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    colors: List[Color]
    psychology: str


class PaletteGenerationResponse(BaseModel):
    palettes: List[Palette]
    remaining_generations: int


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]
    session_id: str


class ChatResponse(BaseModel):
    response: str
    remaining_revisions: int


class RateLimitStatus(BaseModel):
    generations_remaining: int
    revisions_remaining: int
    reset_time: str


# Helper functions
def get_client_ip(request: Request) -> str:
    """Get client IP from request headers or connection"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(ip: str, limit_type: str) -> tuple[bool, int]:
    """Check and update rate limits. Returns (allowed, remaining)"""
    now = datetime.now(timezone.utc)
    
    if ip not in rate_limits:
        rate_limits[ip] = {
            "generations": 1,
            "revisions": 3,
            "reset_time": now + timedelta(days=1)
        }
    
    user_limits = rate_limits[ip]
    
    # Reset if past reset time
    if now >= user_limits["reset_time"]:
        user_limits["generations"] = 1
        user_limits["revisions"] = 3
        user_limits["reset_time"] = now + timedelta(days=1)
    
    if limit_type == "generation":
        if user_limits["generations"] <= 0:
            return False, 0
        user_limits["generations"] -= 1
        return True, user_limits["generations"]
    elif limit_type == "revision":
        if user_limits["revisions"] <= 0:
            return False, 0
        user_limits["revisions"] -= 1
        return True, user_limits["revisions"]
    
    return False, 0


def get_remaining_limits(ip: str) -> dict:
    """Get remaining limits for an IP"""
    now = datetime.now(timezone.utc)
    
    if ip not in rate_limits:
        return {
            "generations_remaining": 1,
            "revisions_remaining": 3,
            "reset_time": (now + timedelta(days=1)).isoformat()
        }
    
    user_limits = rate_limits[ip]
    
    # Reset if past reset time
    if now >= user_limits["reset_time"]:
        return {
            "generations_remaining": 1,
            "revisions_remaining": 3,
            "reset_time": (now + timedelta(days=1)).isoformat()
        }
    
    return {
        "generations_remaining": user_limits["generations"],
        "revisions_remaining": user_limits["revisions"],
        "reset_time": user_limits["reset_time"].isoformat()
    }


def parse_palette_response(response_text: str) -> List[Palette]:
    """Parse AI response into palette objects"""
    palettes = []
    
    # Try to find JSON in the response
    json_match = re.search(r'\[[\s\S]*\]', response_text)
    if json_match:
        try:
            data = json.loads(json_match.group())
            for item in data:
                colors = []
                for color in item.get("colors", []):
                    colors.append(Color(
                        hex=color.get("hex", "#000000"),
                        name=color.get("name", "Unknown"),
                        usage=color.get("usage", "General")
                    ))
                palettes.append(Palette(
                    name=item.get("name", "Palette"),
                    description=item.get("description", ""),
                    colors=colors,
                    psychology=item.get("psychology", "")
                ))
            return palettes
        except json.JSONDecodeError:
            pass
    
    # Fallback: try to extract JSON object
    json_obj_match = re.search(r'\{[\s\S]*"palettes"[\s\S]*\}', response_text)
    if json_obj_match:
        try:
            data = json.loads(json_obj_match.group())
            for item in data.get("palettes", []):
                colors = []
                for color in item.get("colors", []):
                    colors.append(Color(
                        hex=color.get("hex", "#000000"),
                        name=color.get("name", "Unknown"),
                        usage=color.get("usage", "General")
                    ))
                palettes.append(Palette(
                    name=item.get("name", "Palette"),
                    description=item.get("description", ""),
                    colors=colors,
                    psychology=item.get("psychology", "")
                ))
            return palettes
        except json.JSONDecodeError:
            pass
    
    return palettes


# Routes
@api_router.get("/")
async def root():
    return {"message": "ChromaBiz AI API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.get("/rate-limit", response_model=RateLimitStatus)
async def get_rate_limit_status(request: Request):
    """Get current rate limit status for the client"""
    ip = get_client_ip(request)
    limits = get_remaining_limits(ip)
    return RateLimitStatus(**limits)


@api_router.post("/generate-palettes", response_model=PaletteGenerationResponse)
async def generate_palettes(request: Request, data: PaletteGenerationRequest):
    """Generate color palettes using AI"""
    ip = get_client_ip(request)
    
    # Check rate limit
    allowed, remaining = check_rate_limit(ip, "generation")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily generation limit reached. Please try again tomorrow."
        )
    
    # Build the prompt
    age_groups_str = ", ".join(data.age_groups)
    prompt = f"""Generate 5 professional color palettes for a {data.business_name} business in the {data.business_category} industry.

Target Audience:
- Country: {data.target_country}
- Age Groups: {age_groups_str}
- Gender: {data.target_gender}
{f"- Brand Values: {data.brand_values}" if data.brand_values else ""}
{f"- Competitors to differentiate from: {data.competitors}" if data.competitors else ""}

For each palette, provide exactly 5 colors. Consider:
1. Cultural color associations for {data.target_country}
2. Age-appropriate appeal for {age_groups_str}
3. Gender preferences if applicable
4. Industry standards and competitor differentiation

Return ONLY a JSON array with this exact structure (no other text):
[
  {{
    "name": "Palette Name",
    "description": "Brief description",
    "psychology": "Color psychology explanation",
    "colors": [
      {{"hex": "#XXXXXX", "name": "Color Name", "usage": "Primary/Secondary/Accent/Background/Text"}},
      {{"hex": "#XXXXXX", "name": "Color Name", "usage": "Primary/Secondary/Accent/Background/Text"}},
      {{"hex": "#XXXXXX", "name": "Color Name", "usage": "Primary/Secondary/Accent/Background/Text"}},
      {{"hex": "#XXXXXX", "name": "Color Name", "usage": "Primary/Secondary/Accent/Background/Text"}},
      {{"hex": "#XXXXXX", "name": "Color Name", "usage": "Primary/Secondary/Accent/Background/Text"}}
    ]
  }}
]"""

    # Use Google Gemini API for palette generation
    gemini_api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
    if not gemini_api_key:
        logger.error('GOOGLE_GEMINI_API_KEY not set')
        raise HTTPException(status_code=500, detail='Google Gemini API key not configured')

    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-pro')
    try:
        response = model.generate_content(prompt)
        if hasattr(response, 'text'):
            palettes = parse_palette_response(response.text)
        else:
            palettes = []
        if not palettes:
            palettes = generate_fallback_palettes(data.business_category)
        return PaletteGenerationResponse(
            palettes=palettes,
            remaining_generations=remaining
        )
    except Exception as e:
        logger.error(f"Error generating palettes with Gemini: {e}")
        palettes = generate_fallback_palettes(data.business_category)
        return PaletteGenerationResponse(
            palettes=palettes,
            remaining_generations=remaining
        )


def generate_fallback_palettes(category: str) -> List[Palette]:
    """Generate fallback palettes based on category"""
    fallback_palettes = {
        "Food & Beverage": [
            Palette(
                name="Warm Appetite",
                description="Warm, inviting colors that stimulate appetite",
                psychology="Red and orange stimulate hunger, while earth tones create comfort",
                colors=[
                    Color(hex="#D4380D", name="Tomato Red", usage="Primary"),
                    Color(hex="#FA8C16", name="Orange Zest", usage="Secondary"),
                    Color(hex="#FADB14", name="Golden Yellow", usage="Accent"),
                    Color(hex="#F5F0E6", name="Cream", usage="Background"),
                    Color(hex="#3D3D3D", name="Espresso", usage="Text")
                ]
            )
        ],
        "Technology": [
            Palette(
                name="Digital Trust",
                description="Modern, trustworthy tech palette",
                psychology="Blue conveys trust and reliability, common in tech branding",
                colors=[
                    Color(hex="#1890FF", name="Tech Blue", usage="Primary"),
                    Color(hex="#13C2C2", name="Cyan", usage="Secondary"),
                    Color(hex="#722ED1", name="Purple", usage="Accent"),
                    Color(hex="#F0F5FF", name="Ice White", usage="Background"),
                    Color(hex="#262626", name="Charcoal", usage="Text")
                ]
            )
        ]
    }
    
    default_palettes = [
        Palette(
            name="Professional Classic",
            description="Timeless professional palette",
            psychology="Blue builds trust, neutral tones provide balance",
            colors=[
                Color(hex="#2F54EB", name="Royal Blue", usage="Primary"),
                Color(hex="#597EF7", name="Light Blue", usage="Secondary"),
                Color(hex="#F5222D", name="Action Red", usage="Accent"),
                Color(hex="#FAFAFA", name="Off White", usage="Background"),
                Color(hex="#1F1F1F", name="Near Black", usage="Text")
            ]
        ),
        Palette(
            name="Modern Minimal",
            description="Clean, contemporary design",
            psychology="Monochrome with accent creates sophisticated modern feel",
            colors=[
                Color(hex="#000000", name="Pure Black", usage="Primary"),
                Color(hex="#595959", name="Gray", usage="Secondary"),
                Color(hex="#EB2F96", name="Magenta", usage="Accent"),
                Color(hex="#FFFFFF", name="White", usage="Background"),
                Color(hex="#262626", name="Dark Gray", usage="Text")
            ]
        ),
        Palette(
            name="Nature Inspired",
            description="Organic, earthy tones",
            psychology="Green represents growth and harmony, connecting to nature",
            colors=[
                Color(hex="#52C41A", name="Fresh Green", usage="Primary"),
                Color(hex="#389E0D", name="Forest", usage="Secondary"),
                Color(hex="#FAAD14", name="Sunflower", usage="Accent"),
                Color(hex="#F6FFED", name="Mint Cream", usage="Background"),
                Color(hex="#135200", name="Deep Green", usage="Text")
            ]
        ),
        Palette(
            name="Warm Sunset",
            description="Energetic and inviting",
            psychology="Warm colors evoke energy, passion, and friendliness",
            colors=[
                Color(hex="#FA541C", name="Sunset Orange", usage="Primary"),
                Color(hex="#FAAD14", name="Gold", usage="Secondary"),
                Color(hex="#F5222D", name="Coral Red", usage="Accent"),
                Color(hex="#FFF7E6", name="Warm White", usage="Background"),
                Color(hex="#AD2102", name="Deep Orange", usage="Text")
            ]
        ),
        Palette(
            name="Cool Ocean",
            description="Calm and refreshing",
            psychology="Cool tones promote relaxation and trust",
            colors=[
                Color(hex="#1890FF", name="Ocean Blue", usage="Primary"),
                Color(hex="#13C2C2", name="Teal", usage="Secondary"),
                Color(hex="#722ED1", name="Purple Accent", usage="Accent"),
                Color(hex="#E6F7FF", name="Sky White", usage="Background"),
                Color(hex="#003A8C", name="Deep Blue", usage="Text")
            ]
        )
    ]
    
    return fallback_palettes.get(category, default_palettes)


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: Request, data: ChatRequest):
    """Chat with AI for palette refinement"""
    ip = get_client_ip(request)
    
    # Check rate limit
    allowed, remaining = check_rate_limit(ip, "revision")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily revision limit reached. Please try again tomorrow."
        )
    
    gemini_api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
    if not gemini_api_key:
        logger.error('GOOGLE_GEMINI_API_KEY not set')
        raise HTTPException(status_code=500, detail='Google Gemini API key not configured')
    
    # Build context for AI
    palettes_context = json.dumps(data.context.get("palettes", []), indent=2)
    business_info = data.context.get("business_info", {})
    
    system_message = f"""You are a professional color consultant helping refine color palettes for {business_info.get('business_name', 'a business')}.

Business Context:
- Type: {business_info.get('business_category', 'General')}
- Target Country: {business_info.get('target_country', 'Global')}
- Target Audience: {', '.join(business_info.get('age_groups', []))} {business_info.get('target_gender', '')}

Current Palettes:
{palettes_context}

Provide helpful, concise advice about color choices, psychology, and brand alignment. When suggesting color changes, always include specific hex codes. Format color suggestions clearly."""

    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-pro', system_instruction=system_message)
        response = model.generate_content(data.message)
        
        if hasattr(response, 'text'):
            ai_response = response.text
        else:
            ai_response = "Unable to generate response"
        
        return ChatResponse(
            response=ai_response,
            remaining_revisions=remaining
        )
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to get AI response")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
