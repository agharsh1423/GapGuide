from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import openai
import ollama
import json
import re
import requests
from bs4 import BeautifulSoup
from github import Github

# Load environment variables
load_dotenv('../.env')

app = FastAPI(title="Job Resume AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Configuration - Smart fallback system
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'deepseek-r1:8b')

# Determine which provider to use (OpenAI first, Ollama as fallback)
# Valid OpenAI key should start with 'sk-'
USE_OPENAI = bool(OPENAI_API_KEY and OPENAI_API_KEY.strip() and OPENAI_API_KEY.startswith('sk-'))

# Configure OpenAI client if available
openai_client = None
if USE_OPENAI:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("AI Provider: OpenAI (with Ollama fallback)")
    except Exception as e:
        print(f"Failed to initialize OpenAI client: {e}")
        print("AI Provider: Ollama only")
else:
    print("AI Provider: Ollama (OpenAI API key not configured)")

# Pydantic models
class ResumeParseRequest(BaseModel):
    text: str

class JobRecommendRequest(BaseModel):
    parsedData: Dict[str, Any]
    analysis: Dict[str, Any]

class SkillsJobRequest(BaseModel):
    skills: List[str]

class ChatRequest(BaseModel):
    resumeData: Dict[str, Any]
    message: str
    conversationHistory: List[Dict[str, str]] = []

class InterviewQuestionsRequest(BaseModel):
    parsedData: Dict[str, Any]
    analysis: Dict[str, Any]

class SkillGapRequest(BaseModel):
    resumeData: Dict[str, Any]
    targetJobTitle: str


def call_ai(messages, temperature=0.7, max_tokens=2000):
    """Helper function to call AI API (OpenAI first, Ollama as fallback)"""

    # Try OpenAI first if configured
    if openai_client:
        try:
            print("Trying OpenAI...")
            response = openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            print("✓ OpenAI succeeded")
            return response.choices[0].message.content
        except Exception as e:
            print(f"✗ OpenAI failed: {e}")
            print("Falling back to Ollama...")

    # Use Ollama (either as fallback or primary)
    try:
        # Format messages for Ollama
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })

        print(f"Calling Ollama with model: {OLLAMA_MODEL}")
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=formatted_messages,
            options={
                'temperature': temperature,
                'num_predict': max_tokens
            }
        )
        content = response['message']['content']

        # DeepSeek R1 sometimes wraps responses in <think> tags, extract the actual content
        if '<think>' in content:
            # Extract content after </think> tag
            parts = content.split('</think>')
            if len(parts) > 1:
                content = parts[-1].strip()

        print(f"Ollama response length: {len(content)} chars")

        if not content or len(content.strip()) == 0:
            raise ValueError("Ollama returned empty response")

        print("✓ Ollama succeeded")
        return content

    except Exception as e:
        print(f"✗ Ollama failed: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"All AI providers failed. Last error: {str(e)}")


def analyze_github_repo(github_url):
    """Analyze GitHub repository to extract project information"""
    try:
        # Extract owner and repo name from URL
        match = re.search(r'github\.com/([^/]+)/([^/]+)', github_url)
        if not match:
            return None

        owner, repo_name = match.groups()
        repo_name = repo_name.replace('.git', '')

        # Initialize GitHub client (no auth required for public repos)
        g = Github()
        repo = g.get_repo(f"{owner}/{repo_name}")

        # Get README content
        try:
            readme = repo.get_readme()
            readme_content = readme.decoded_content.decode('utf-8')
        except:
            readme_content = "No README available"

        # Get repository metadata
        repo_data = {
            'name': repo.name,
            'description': repo.description,
            'language': repo.language,
            'topics': repo.get_topics(),
            'stars': repo.stargazers_count,
            'readme': readme_content[:1000]  # First 1000 chars
        }

        return repo_data
    except Exception as e:
        print(f"GitHub analysis error: {e}")
        return None


def analyze_website(url):
    """Analyze a live website to understand the project"""
    try:
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract title and meta description
        title = soup.find('title')
        title_text = title.get_text() if title else ""

        meta_desc = soup.find('meta', attrs={'name': 'description'})
        description = meta_desc['content'] if meta_desc else ""

        # Get some text content
        paragraphs = soup.find_all('p')
        text_content = ' '.join([p.get_text() for p in paragraphs[:5]])

        return {
            'title': title_text,
            'description': description,
            'content_preview': text_content[:500]
        }
    except Exception as e:
        print(f"Website analysis error: {e}")
        return None


@app.get("/")
def read_root():
    return {"message": "Job Resume AI Service is running", "status": "active"}


@app.post("/parse-resume")
async def parse_resume(request: ResumeParseRequest):
    """Parse resume text and extract structured information"""

    system_prompt = """You are an expert resume parser and career analyst.
    Extract structured information from the resume text and provide detailed analysis.

    Return a JSON object with the following structure:
    {
        "parsedData": {
            "name": "Full name",
            "email": "email@example.com",
            "phone": "phone number",
            "skills": ["skill1", "skill2"],
            "experience": [{"title": "", "company": "", "duration": "", "description": ""}],
            "education": [{"degree": "", "institution": "", "year": ""}],
            "projects": [{"name": "", "description": "", "technologies": [], "githubUrl": "", "liveUrl": ""}],
            "githubProfile": "github url if found",
            "summary": "brief professional summary"
        },
        "analysis": {
            "skillLevel": "Junior/Mid-Level/Senior",
            "primaryDomain": "main area of expertise",
            "experienceYears": estimated years,
            "strengths": ["strength1", "strength2"],
            "recommendations": ["recommendation1", "recommendation2"]
        }
    }

    Be thorough and extract all possible information. If information is not found, use empty strings or arrays."""

    user_prompt = f"Resume text:\n\n{request.text}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = call_ai(messages, temperature=0.3, max_tokens=3000)

    try:
        # Try to extract JSON from response (in case it's wrapped in markdown)
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            response = json_match.group(1)

        # Parse JSON response
        result = json.loads(response)

        # Analyze GitHub repos if found
        if 'parsedData' in result and 'projects' in result['parsedData']:
            for project in result['parsedData']['projects']:
                if project.get('githubUrl'):
                    github_data = analyze_github_repo(project['githubUrl'])
                    if github_data:
                        project['githubAnalysis'] = github_data

                if project.get('liveUrl'):
                    website_data = analyze_website(project['liveUrl'])
                    if website_data:
                        project['websiteAnalysis'] = website_data

        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")


@app.post("/recommend-jobs")
async def recommend_jobs(request: JobRecommendRequest):
    """Recommend jobs based on parsed resume data and analysis"""

    system_prompt = """You are an expert career counselor and job matching specialist.
    Based on the candidate's resume data and analysis, recommend suitable job roles.

    Consider:
    - Their skills and technical expertise
    - Years of experience
    - Projects they've worked on
    - GitHub repositories and live projects
    - Education background
    - Primary domain and strengths

    Return a JSON array of job recommendations with this structure:
    [
        {
            "jobTitle": "specific job title",
            "matchPercentage": 85,
            "reasoning": "detailed explanation of why this job fits",
            "requiredSkills": ["skill1", "skill2"],
            "matchedSkills": ["skill1", "skill2"],
            "missingSkills": ["skill3"]
        }
    ]

    Provide 5-8 job recommendations, ordered by match percentage (highest first).
    Be realistic about match percentages based on actual skills and experience."""

    user_prompt = f"""Parsed Resume Data:
{json.dumps(request.parsedData, indent=2)}

Analysis:
{json.dumps(request.analysis, indent=2)}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = call_ai(messages, temperature=0.5, max_tokens=3000)

    try:
        # Try to extract JSON from response (in case it's wrapped in markdown)
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            response = json_match.group(1)

        recommendations = json.loads(response)
        return {"recommendations": recommendations}
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Raw response from OpenAI: {response}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")


@app.post("/recommend-jobs-by-skills")
async def recommend_jobs_by_skills(request: SkillsJobRequest):
    """Recommend jobs based on selected skills"""

    system_prompt = """You are an expert career counselor.
    Based on the provided skills, recommend suitable job roles.

    Return a JSON array with this structure:
    [
        {
            "jobTitle": "specific job title",
            "matchPercentage": 75,
            "reasoning": "why this job fits these skills",
            "requiredSkills": ["skill1", "skill2"],
            "matchedSkills": ["skill1"],
            "missingSkills": ["skill2"]
        }
    ]

    Provide 5-8 recommendations ordered by relevance."""

    user_prompt = f"Skills: {', '.join(request.skills)}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = call_ai(messages, temperature=0.5, max_tokens=2500)

    try:
        # Try to extract JSON from response (in case it's wrapped in markdown)
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            response = json_match.group(1)

        recommendations = json.loads(response)
        return {"recommendations": recommendations}
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Raw response from OpenAI: {response}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")


@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat about the resume with AI assistant"""

    system_prompt = f"""You are a helpful career counselor and resume expert assistant.
    You have access to the user's resume data and can answer questions about it,
    provide career advice, and help with interview preparation.

    Resume Data:
    {json.dumps(request.resumeData, indent=2)}

    Be conversational, helpful, and provide actionable advice.
    Reference specific parts of their resume when relevant."""

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    for msg in request.conversationHistory:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add new user message
    messages.append({"role": "user", "content": request.message})

    response = call_ai(messages, temperature=0.7, max_tokens=1500)

    # Update conversation history
    new_history = request.conversationHistory + [
        {"role": "user", "content": request.message},
        {"role": "assistant", "content": response}
    ]

    return {
        "reply": response,
        "conversationHistory": new_history
    }


@app.post("/generate-interview-questions")
async def generate_interview_questions(request: InterviewQuestionsRequest):
    """Generate interview questions based on resume"""

    system_prompt = """You are an expert interviewer and technical recruiter.
    Based on the candidate's resume, generate relevant interview questions they might face.

    Include:
    - Technical questions based on their skills
    - Behavioral questions about their experience
    - Project-specific questions
    - Questions about technologies they've listed

    Return a JSON object with this structure:
    {
        "questions": [
            {
                "category": "Technical|Behavioral|Project-Based",
                "question": "the interview question",
                "topic": "relevant skill/project",
                "difficulty": "Easy|Medium|Hard",
                "tip": "brief tip on how to answer"
            }
        ]
    }

    Provide 15-20 diverse questions."""

    user_prompt = f"""Resume Data:
{json.dumps(request.parsedData, indent=2)}

Analysis:
{json.dumps(request.analysis, indent=2)}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = call_ai(messages, temperature=0.6, max_tokens=3000)

    try:
        # Try to extract JSON from response (in case it's wrapped in markdown)
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            response = json_match.group(1)

        result = json.loads(response)
        return result
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Raw response from OpenAI: {response}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")


@app.post("/analyze-skill-gap")
async def analyze_skill_gap(request: SkillGapRequest):
    """Analyze skill gap between user's skills and target job requirements"""

    system_prompt = """You are an expert career counselor and skills assessment specialist.
    Analyze the gap between a candidate's current skills and the requirements for their target job.

    Provide a detailed analysis in JSON format with this structure:
    {
        "matchPercentage": 75,
        "userSkills": ["skill1", "skill2", ...],
        "requiredSkills": ["skill1", "skill2", "skill3", ...],
        "matchedSkills": ["skill1", "skill2"],
        "missingSkills": ["skill3"],
        "skillsToImprove": [
            {
                "skill": "skill name",
                "currentLevel": "Beginner/Intermediate/Advanced",
                "requiredLevel": "Intermediate/Advanced/Expert",
                "priority": "High/Medium/Low"
            }
        ],
        "learningPath": [
            {
                "skill": "skill name",
                "resources": ["recommended course/resource 1", "resource 2"],
                "estimatedTime": "2-3 months",
                "difficulty": "Easy/Medium/Hard"
            }
        ],
        "summary": "Brief overall assessment of readiness",
        "recommendations": ["specific actionable recommendation 1", "recommendation 2"]
    }

    Be realistic and specific. Provide actionable learning resources."""

    user_prompt = f"""Target Job: {request.targetJobTitle}

Candidate's Resume Data:
{json.dumps(request.resumeData, indent=2)}

Analyze the skill gap and provide detailed recommendations."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = call_ai(messages, temperature=0.5, max_tokens=3000)

    try:
        # Try to extract JSON from response (in case it's wrapped in markdown)
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            response = json_match.group(1)

        result = json.loads(response)
        return result
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Raw response from OpenAI: {response}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
