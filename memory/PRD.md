# ChromaBiz AI - Color Palette Generator

## Original Problem Statement
Build a web application that uses Google Gemini AI to generate business-specific color palettes based on user inputs. The app should be accessible without authentication, with usage limits enforced via IP-based restrictions and browser caching.

## Architecture
- **Frontend**: React 19 with TailwindCSS, Shadcn/UI components
- **Backend**: FastAPI with Python
- **Database**: MongoDB (for status checks)
- **AI**: Google Gemini 3 Flash

## User Personas
1. **Business Owners** - Need brand colors for new businesses
2. **Designers** - Looking for inspiration and AI-generated palettes
3. **Marketers** - Need culturally-appropriate colors for campaigns

## Core Requirements (Static)
- Business input form with required/optional fields
- AI-generated color palettes (5-7 options)
- Copy hex codes, export PNG/CSS/JSON
- AI chatbot for palette refinement
- IP-based rate limiting (1 gen/3 revisions per day)
- Browser caching for palettes/favorites

## What's Been Implemented (Jan 2026)
- [x] Complete business input form with validation
- [x] Category, country, gender dropdowns
- [x] Age group multi-select badges
- [x] Gemini 3 Flash palette generation
- [x] Palette cards with color swatches
- [x] Click-to-copy hex codes
- [x] Export (PNG, CSS variables, JSON)
- [x] Favorite/star palettes (localStorage)
- [x] AI chatbot panel with suggestions
- [x] In-memory IP rate limiting
- [x] Responsive 70/30 layout
- [x] Mobile sheet drawer for chat

## Prioritized Backlog
### P0 (Critical)
- None - Core MVP complete

### P1 (High Priority)
- Persist rate limits in MongoDB
- Color blind simulation mode
- Palette comparison view

### P2 (Nice to Have)
- Shareable palette URLs
- Brand style guide PDF export
- Dark mode toggle
- Analytics dashboard

## Next Tasks
1. Add MongoDB persistence for rate limits
2. Implement color blind simulator
3. Add side-by-side palette comparison
