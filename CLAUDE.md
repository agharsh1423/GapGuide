# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A three-tier AI-powered job recommendation system that analyzes resumes and matches candidates with suitable job roles. The system uses OpenAI GPT-4 to parse resumes, analyze skills, scrape GitHub repositories, and provide personalized job recommendations.

## Architecture

### Three-Service Architecture

1. **Backend (Node.js/Express)** - Port 5000
   - Handles HTTP requests, authentication, file uploads
   - Orchestrates calls to AI service
   - Manages MongoDB database operations
   - Located in: `backend/`

2. **AI Service (Python/FastAPI)** - Port 8000
   - OpenAI GPT-4 integration for resume parsing
   - GitHub API integration for repository analysis
   - Web scraping for live project analysis
   - Located in: `ai-service/`

3. **Frontend (React/Vite)** - Port 3000
   - React SPA with React Router
   - Tailwind CSS for styling
   - Axios for API communication
   - Located in: `frontend/`

### Request Flow

Resume upload → Backend → AI Service (GPT-4 parsing + GitHub/web analysis) → Backend (stores in MongoDB) → Frontend displays results

### Key Data Models

**Resume Schema** (backend/models/Resume.js):
- `parsedData`: Structured resume data extracted by AI (name, email, skills, experience, education, projects)
- `aiAnalysis`: AI-generated insights (skillLevel, primaryDomain, experienceYears, strengths, recommendations)
- `jobRecommendations`: Array of job matches with matchPercentage, reasoning, matchedSkills, missingSkills

**User Schema** (backend/models/User.js):
- JWT-based authentication
- Password hashing with bcryptjs

## Development Commands

### Start All Services
```bash
npm run dev:all
```
Runs backend (nodemon), frontend (vite), and Python AI service concurrently.

### Individual Services
```bash
# Backend only
npm run dev

# Frontend only
npm run client

# Python AI service only
npm run python
# or: cd ai-service && python app.py
```

### Frontend Build
```bash
cd frontend && npm run build
```

### Testing
```bash
# Backend tests
npm test

# Frontend tests
cd frontend && npm test
```

## Environment Configuration

The `.env` file at root contains:
- `OPENAI_API_KEY`: Required for AI service
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/job-resume-matcher`)
- `JWT_SECRET`: Secret for JWT tokens
- `PYTHON_SERVICE_URL`: URL to Python service (default: `http://localhost:8000`)

## Important Implementation Details

### AI Service Integration

The backend communicates with the Python service via HTTP. All AI operations (resume parsing, job recommendations, chat) go through the Python service at `PYTHON_SERVICE_URL`.

Backend calls Python endpoints:
- `/parse-resume` - Extracts structured data from resume text
- `/recommend-jobs` - Generates job matches based on resume
- `/recommend-jobs-by-skills` - Finds jobs by selected skills
- `/chat` - Resume-focused chatbot with conversation history
- `/generate-interview-questions` - Creates interview prep questions

### File Upload Processing

Resume upload flow (backend/routes/resume.js):
1. Multer saves file to `uploads/` directory
2. Extract text based on file type (PDF via pdf-parse, DOCX via mammoth, TXT/TEX via fs)
3. Send text to Python service for AI parsing
4. For projects with GitHub URLs: Python service uses PyGithub to fetch repo metadata, README, language, topics
5. For projects with live URLs: Python service scrapes website title, meta description, content preview
6. Store enriched data in MongoDB

Supported formats: PDF, TXT, DOC, DOCX, TEX (10MB limit)

### Authentication Flow

JWT-based auth (backend/middleware/auth.js):
- Token stored in localStorage on frontend
- Interceptor adds `Authorization: Bearer <token>` header to all API requests (frontend/src/services/api.js:10)
- Middleware validates token and attaches `req.userId` for protected routes

### Frontend API Integration

Centralized API client at `frontend/src/services/api.js`:
- All backend calls go through axios instance with baseURL `http://localhost:5000/api`
- Token automatically injected via interceptor
- Functions exported for auth, resume operations, jobs, chatbot

## MongoDB Dependencies

MongoDB must be running before starting the backend. The application uses Mongoose with connection URL from `.env`. Default database name: `job-resume-matcher`

## Python Dependencies

The AI service requires:
- fastapi
- uvicorn
- openai
- python-dotenv
- PyGithub
- beautifulsoup4
- requests
- pydantic

Install via: `cd ai-service && pip install -r requirements.txt`

## Common Issues

### MongoDB Connection Failures
Ensure MongoDB is running locally or update `MONGODB_URI` in `.env` for cloud MongoDB.

### Python Service Port Conflicts
If port 8000 is occupied, update the port in `ai-service/app.py:373` and `PYTHON_SERVICE_URL` in `.env`.

### OpenAI API Errors
The AI service uses `gpt-4-turbo-preview` model. Verify API key has access and sufficient credits.

## Testing Individual Components

### Test AI Service Directly
```bash
curl -X POST http://localhost:8000/parse-resume \
  -H "Content-Type: application/json" \
  -d '{"text": "Your resume text here"}'
```

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

## Notes on Code Organization

- Backend routes follow pattern: `routes/` define endpoints, call models in `models/`, use middleware from `middleware/`
- Frontend pages in `src/pages/` are route components, shared UI in `src/components/`
- All AI logic isolated in Python service - backend never directly calls OpenAI
- Resume data flows: Upload → Parse → Analyze → Recommend → Store
