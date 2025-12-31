# Job Resume Matcher - AI-Powered Job Recommendation System

An intelligent job recommendation system that analyzes resumes using AI and provides personalized job matches with detailed insights. The system analyzes skills, experience, GitHub repositories, live projects, and provides an AI chatbot for resume discussion and interview preparation.

## Features

- **Resume Upload & Parsing** - Support for PDF, Word, TXT, and LaTeX files
- **AI-Powered Analysis** - Extracts skills, experience, projects, and education
- **GitHub Integration** - Analyzes GitHub repositories to understand project complexity
- **Website Analysis** - Checks live project URLs to gather more insights
- **Job Recommendations** - Provides personalized job matches with percentage scores
- **Skills-Based Search** - Find jobs by selecting your skills
- **AI Chatbot** - Interactive assistant to discuss your resume
- **Interview Prep** - Generates relevant interview questions based on your resume
- **User Authentication** - Secure signup/login system

## Tech Stack

### Frontend
- React with Vite
- Tailwind CSS
- Axios for API calls
- React Router for navigation
- Lucide React for icons

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- PDF and Word document parsing

### AI Service
- Python + FastAPI
- OpenAI GPT-4 API
- GitHub API integration
- BeautifulSoup for web scraping

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (running locally or cloud)
- OpenAI API Key

## Installation

### 1. Clone the repository

```bash
cd ishancode
```

### 2. Configure Environment Variables

The `.env` file is already created with your OpenAI API key. Make sure to update other values if needed:

```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/job-resume-matcher
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=5000
PYTHON_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### 3. Install Backend Dependencies

```bash
npm install
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Install Python Dependencies

```bash
cd ai-service
pip install -r requirements.txt
cd ..
```

## Running the Application

You have two options to run the application:

### Option 1: Run all services concurrently (Recommended)

```bash
npm run dev:all
```

This will start:
- Backend server on http://localhost:5000
- Frontend dev server on http://localhost:3000
- Python AI service on http://localhost:8000

### Option 2: Run services separately

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

**Terminal 3 - Python AI Service:**
```bash
npm run python
```

Or directly:
```bash
cd ai-service
python app.py
```

## Usage

1. **Sign Up** - Create a new account at http://localhost:3000/signup

2. **Upload Resume** - Upload your resume in PDF, Word, TXT, or LaTeX format
   - Or paste your resume text directly

3. **View Analysis** - See AI-generated insights about your skills and experience

4. **Check Job Recommendations** - Review personalized job matches with percentage scores

5. **Chat with AI** - Discuss your resume and get career advice

6. **Interview Prep** - Generate interview questions based on your resume

7. **Skills Match** - Search for jobs by selecting your skills

## Project Structure

```
ishancode/
├── backend/
│   ├── models/          # MongoDB models (User, Resume)
│   ├── routes/          # API routes (auth, resume, jobs, chatbot)
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components (Navbar)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   └── App.jsx      # Main app component
│   └── package.json
├── ai-service/
│   ├── app.py          # FastAPI application
│   └── requirements.txt
├── .env                # Environment variables
└── package.json        # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login

### Resume
- `POST /api/resume/upload` - Upload resume file
- `POST /api/resume/upload-text` - Upload resume as text
- `GET /api/resume/my-resumes` - Get all user resumes
- `GET /api/resume/:id` - Get specific resume
- `DELETE /api/resume/:id` - Delete resume

### Jobs
- `POST /api/jobs/recommend-by-skills` - Get job recommendations by skills
- `GET /api/jobs/categories` - Get job categories

### Chatbot
- `POST /api/chatbot/chat` - Chat about resume
- `POST /api/chatbot/interview-questions` - Generate interview questions

## AI Service Endpoints

- `POST /parse-resume` - Parse resume text and extract structured data
- `POST /recommend-jobs` - Generate job recommendations
- `POST /recommend-jobs-by-skills` - Get jobs based on skills
- `POST /chat` - Chat with AI about resume
- `POST /generate-interview-questions` - Generate interview questions

## Features in Detail

### Resume Analysis
- Extracts personal information, skills, experience, education, and projects
- Analyzes GitHub repositories to understand project depth
- Checks live websites to gather additional context
- Provides AI-generated career insights and recommendations

### Job Matching
- Compares resume data with job requirements
- Calculates match percentages based on skills and experience
- Identifies matched skills and skills to learn
- Provides reasoning for each recommendation

### AI Chatbot
- Context-aware conversations about your resume
- Career advice and guidance
- Interview preparation tips
- Resume improvement suggestions

## Development

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The build files will be in frontend/dist/
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongosh` or check your MongoDB service
- Update `MONGODB_URI` in `.env` if using cloud MongoDB

### Python Service Not Starting
- Check if port 8000 is available
- Ensure all Python dependencies are installed: `pip install -r ai-service/requirements.txt`

### OpenAI API Errors
- Verify your API key in `.env`
- Check API rate limits and credits

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
