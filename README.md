# ChromaBiz AI - Color Palette Generator

An AI-powered web application that generates professional color palettes tailored to your business, audience, and market using Google Gemini AI.

## Features

- **AI-Powered Palette Generation**: Generate 5 professional color palettes using Google Gemini 3 Flash
- **Business-Specific Recommendations**: Tailored to your industry, target audience, and regional preferences
- **Interactive Chat Assistant**: Refine palettes with AI-powered suggestions
- **Multiple Export Formats**: PNG, CSS variables, and JSON
- **Favorite Management**: Save and organize your favorite palettes
- **Rate Limiting**: Fair usage with IP-based rate limits (1 generation, 3 revisions per day)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, TailwindCSS, Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (for status tracking)
- **AI Model**: Google Gemini 3 Flash (via google-generativeai SDK)
- **Deployment Options**: Localhost, Netlify (frontend), Render (backend)

---

## Getting Started Locally

### Prerequisites

- **Node.js** (v16+) and npm/yarn
- **Python** (v3.9+) and pip
- **MongoDB** (running locally or remote connection string)
- **Google Gemini API Key** (get one at [ai.google.dev](https://ai.google.dev))

### 1. Clone the Repository

```bash
git clone https://github.com/highvolthero/chromabiz.git
cd chromabiz
```

### 2. Backend Setup

#### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables

Create or edit `backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="chromabiz"
CORS_ORIGINS="*"
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here
```

**Get your Gemini API Key:**
1. Visit [ai.google.dev/app/apikey](https://ai.google.dev/app/apikey)
2. Click "Create API Key"
3. Copy and paste into the `.env` file

#### Start the Backend Server

```bash
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

**API Documentation**: Visit `http://localhost:8000/docs` for interactive API docs

### 3. Frontend Setup

#### Install Frontend Dependencies

```bash
cd ../frontend
npm install
# or
yarn install
```

#### Configure Environment Variables

Create or edit `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GEMINI_API_KEY=your-google-gemini-api-key-here
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
DISABLE_VISUAL_EDITS=true
```

#### Start the Frontend Development Server

```bash
npm start
# or
yarn start
```

The app will open at `http://localhost:3000`

### 4. Test the Application

```bash
cd ../
python backend_test.py
```

---

## Deployment Guide

### Option 1: Deploy Frontend to Netlify

#### Prerequisites
- Netlify account (free at [netlify.com](https://netlify.com))
- GitHub repository with this code pushed

#### Steps

1. **Connect Your GitHub Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Select GitHub and authorize
   - Choose your `chromabiz` repository

2. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build` or `yarn build`
   - **Publish directory**: `frontend/build`

3. **Set Environment Variables**
   - In Netlify, go to Site Settings → Build & Deploy → Environment
   - Add:
     ```
     REACT_APP_BACKEND_URL=https://your-backend-url.com
     REACT_APP_GEMINI_API_KEY=your-api-key
     ```

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Your frontend will be live at `https://your-site-name.netlify.app`

#### Advanced: Custom Domain
- Go to Site Settings → Domain Management
- Add your custom domain (e.g., `chromabiz.com`)

---

### Option 2: Deploy Backend to Render

#### Prerequisites
- Render account (free at [render.com](https://render.com))
- GitHub repository with this code pushed

#### Steps

1. **Create a New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `chromabiz-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port 8000`

3. **Set Environment Variables**
   - In Render, go to Environment
   - Add the following:
     ```
     MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/chromabiz
     DB_NAME=chromabiz
     CORS_ORIGINS=https://your-netlify-site.netlify.app
     GOOGLE_GEMINI_API_KEY=your-api-key
     ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will auto-deploy when you push to GitHub
   - Your backend URL will be `https://chromabiz-backend.onrender.com`

#### Note on MongoDB
- Use **MongoDB Atlas** (free at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas))
- Create a cluster and get your connection string
- Update `MONGO_URL` in Render environment variables

---

### Option 3: Full Stack Deployment (Alternative Platforms)

#### Vercel (Frontend)
1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com) and import your repo
3. Set `REACT_APP_BACKEND_URL` in project settings
4. Deploy

#### Railway or Fly.io (Backend)
1. Install CLI: `railway login` or `flyctl auth login`
2. Run: `railway init` or `flyctl launch`
3. Add MongoDB connection string
4. Add Gemini API key
5. Deploy

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URL` | Yes | - | MongoDB connection string |
| `DB_NAME` | Yes | `chromabiz` | Database name |
| `CORS_ORIGINS` | No | `*` | Allowed origins (comma-separated) |
| `GOOGLE_GEMINI_API_KEY` | Yes | - | Google Gemini API key |

### Frontend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_BACKEND_URL` | Yes | `http://localhost:8000` | Backend API URL |
| `REACT_APP_GEMINI_API_KEY` | No | - | Optional for frontend AI features |
| `WDS_SOCKET_PORT` | No | `443` | WebSocket port for dev server |
| `ENABLE_HEALTH_CHECK` | No | `false` | Enable health checks |
| `DISABLE_VISUAL_EDITS` | No | `true` | Disable visual editing tools |

---

## API Endpoints

All endpoints are prefixed with `/api`

### Palette Generation
- **POST** `/generate-palettes` - Generate 5 color palettes
- **GET** `/rate-limit` - Check remaining generations/revisions

### Chat Assistant
- **POST** `/chat` - Send message to AI assistant for palette refinement

### Status Checks
- **GET** `/status` - Get all status checks
- **POST** `/status` - Create a status check

### Root
- **GET** `/` - API health check

---

## Troubleshooting

### "API key not configured" Error
- Ensure `GOOGLE_GEMINI_API_KEY` is set in your `.env` file
- Verify your API key is valid at [ai.google.dev](https://ai.google.dev)

### CORS Error (Frontend can't reach Backend)
- Check that `REACT_APP_BACKEND_URL` matches your backend URL
- Ensure backend `CORS_ORIGINS` includes your frontend URL
- On Render, update `CORS_ORIGINS` to your Netlify domain

### MongoDB Connection Issues
- For local: Ensure MongoDB is running (`mongod`)
- For Atlas: Check connection string in `.env`
- Verify IP whitelist allows your deployment platform

### Netlify Deploy Fails
- Run `npm run build` locally to catch build errors
- Check build logs in Netlify dashboard
- Ensure Node.js version is v16+

### Render Deploy Fails
- Check "Logs" tab for error messages
- Verify Python version requirements
- Ensure all dependencies in `requirements.txt` are available

---

## Development

### Local Testing with Mock Data
If you don't want to use Gemini API during development, the app falls back to curated palette templates.

### Running Tests
```bash
cd backend
pytest
```

### Code Quality
```bash
# Backend
black backend/
isort backend/
flake8 backend/

# Frontend
npm run lint
```

---

## Rate Limiting

The app implements IP-based rate limiting:
- **1 palette generation per day**
- **3 palette revisions per day**
- Limits reset daily at UTC midnight

---

## Support & Contributing

- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Pull Requests**: Contributions welcome!

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Quick Start Summary

```bash
# Backend
cd backend && pip install -r requirements.txt
# Edit backend/.env with your Gemini API key
python -m uvicorn server:app --reload

# Frontend (new terminal)
cd frontend && npm install
# Edit frontend/.env
npm start

# Test
python backend_test.py
```

**Frontend**: http://localhost:3000  
**Backend API**: http://localhost:8000  
**API Docs**: http://localhost:8000/docs
