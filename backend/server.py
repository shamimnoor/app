"""
Shamim Noor — AI-Powered Personal Brand Platform & Founder OS
Backend (FastAPI + MongoDB)
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Annotated, List, Optional

import bcrypt
import jwt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = os.environ.get("JWT_ALG", "HS256")
JWT_EXP_DAYS = int(os.environ.get("JWT_EXP_DAYS", "30"))
FOUNDER_EMAIL = os.environ["FOUNDER_EMAIL"].lower().strip()
FOUNDER_NAME = os.environ.get("FOUNDER_NAME", "Shamim Noor")
FOUNDER_AVATAR = os.environ.get("FOUNDER_AVATAR", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Shamim Noor Founder OS API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("shamimnoor")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s.lower()).strip()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:80] or uuid.uuid4().hex[:8]

def make_token(user_id: str, email: str, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS)
    payload = {"sub": user_id, "email": email, "role": role, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def anon_fingerprint(request: Request) -> str:
    ip = request.client.host if request.client else "0.0.0.0"
    ua = request.headers.get("user-agent", "")
    return hashlib.sha256(f"{ip}|{ua}".encode()).hexdigest()[:32]

async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any] | None:
    if not creds:
        return None
    try:
        payload = decode_token(creds.credentials)
        user = await db.users.find_one({"id": payload["sub"]})
        if user:
            user.pop("_id", None)
            user.pop("password", None)
        return user
    except Exception:
        return None

async def require_user(user: dict[str, Any] | None = Depends(get_current_user)) -> dict[str, Any]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_founder(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    if user.get("role") != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
    return user

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CommentIn(BaseModel):
    content_type: str
    content_id: str
    body: str

class LikeIn(BaseModel):
    content_type: str
    content_id: str

class BookmarkIn(BaseModel):
    content_type: str
    content_id: str
    title: Optional[str] = None

class LeadIn(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    message: str
    source: Optional[str] = "contact"

class MessageIn(BaseModel):
    body: str
    to_founder: bool = True
    thread_user_id: Optional[str] = None

class BlogIn(BaseModel):
    title: str
    excerpt: str
    body: str
    cover: Optional[str] = None
    tags: List[str] = []
    category: str = "General"
    status: str = "published"  # draft | published

class ProjectIn(BaseModel):
    title: str
    summary: str
    body: str = ""
    cover: Optional[str] = None
    tags: List[str] = []
    industry: Optional[str] = None
    client: Optional[str] = None
    status: str = "published"

class CommandIn(BaseModel):
    prompt: str

class CopilotIn(BaseModel):
    message: str
    session_id: Optional[str] = None

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
SEED_SERVICES = [
    {
        "id": "svc-business-systems",
        "title": "Business Systems Design",
        "icon": "Workflow",
        "tagline": "Architect the operating system your business runs on.",
        "description": "End-to-end design of the systems, dashboards and SOPs that make your company scalable and predictable.",
        "deliverables": ["System map", "SOP library", "Dashboards", "Hand-off training"],
        "starting_price": "from $4,800",
    },
    {
        "id": "svc-automation",
        "title": "Automation Architecture",
        "icon": "Bot",
        "tagline": "Replace busywork with elegant n8n + AI workflows.",
        "description": "We build automation pipelines that connect your CRM, marketing, billing and ops — fully owned by you.",
        "deliverables": ["Workflow blueprints", "n8n flows", "AI agents", "Monitoring"],
        "starting_price": "from $2,400",
    },
    {
        "id": "svc-client-portals",
        "title": "Client Portals & Dashboards",
        "icon": "LayoutDashboard",
        "tagline": "Premium client experiences that win retention.",
        "description": "Beautiful, brandable portals so your clients self-serve, track delivery and feel taken care of.",
        "deliverables": ["Custom portal", "Roles & auth", "File hand-off", "White-label"],
        "starting_price": "from $3,600",
    },
    {
        "id": "svc-crm",
        "title": "CRM & Pipeline Engineering",
        "icon": "Users",
        "tagline": "A CRM that actually fits how you sell.",
        "description": "Replace generic SaaS with a tailored CRM tuned to your funnel, pipeline and reporting needs.",
        "deliverables": ["Pipeline schema", "Lead automations", "Reports", "Migration"],
        "starting_price": "from $2,800",
    },
    {
        "id": "svc-ai-copilots",
        "title": "AI Copilots & Knowledge",
        "icon": "Sparkles",
        "tagline": "Your private operator that knows your business.",
        "description": "Custom GPT copilots wired to your data — for sales, support, content and research.",
        "deliverables": ["Knowledge base", "Copilot UX", "Guardrails", "Analytics"],
        "starting_price": "from $3,200",
    },
    {
        "id": "svc-websites",
        "title": "Modern Web Experiences",
        "icon": "Globe",
        "tagline": "Sites that feel like Apple, Linear and Stripe.",
        "description": "Premium marketing & product sites built for speed, SEO and conversion.",
        "deliverables": ["Design system", "CMS", "Analytics", "SEO foundation"],
        "starting_price": "from $3,000",
    },
]

SEED_SOLUTIONS = [
    {"id": "sol-agency-os", "title": "Agency Operating System", "summary": "Unified CRM, project, content and finance system for boutique agencies."},
    {"id": "sol-client-portal", "title": "Client Portal Platform", "summary": "White-label portal where clients track work, approve assets and chat."},
    {"id": "sol-content-engine", "title": "AI Content Engine", "summary": "Pipeline that turns one idea into LinkedIn, X, YouTube and newsletter content."},
    {"id": "sol-sales-copilot", "title": "Sales Copilot", "summary": "AI copilot that drafts proposals, replies to leads and forecasts revenue."},
    {"id": "sol-ops-automation", "title": "Ops Automation Stack", "summary": "n8n + Zapier + custom services to remove repetitive operations work."},
    {"id": "sol-founder-os", "title": "Founder OS Dashboard", "summary": "One unified dashboard for founders: people, revenue, projects, content."},
]

SEED_INDUSTRIES = [
    {"id": "ind-saas", "name": "SaaS & Software", "blurb": "Onboarding, billing and lifecycle automation for product teams."},
    {"id": "ind-agency", "name": "Creative Agencies", "blurb": "Studio ops, client delivery and retainer management."},
    {"id": "ind-ecom", "name": "E-commerce", "blurb": "Post-purchase, support and merchandising automation."},
    {"id": "ind-finance", "name": "Finance & Fintech", "blurb": "Secure dashboards, compliance and reporting layers."},
    {"id": "ind-health", "name": "Healthcare", "blurb": "Patient intake, scheduling and HIPAA-friendly portals."},
    {"id": "ind-education", "name": "Education", "blurb": "Cohort tooling, student dashboards and AI tutoring."},
    {"id": "ind-realestate", "name": "Real Estate", "blurb": "Lead routing, CRM and listing automation."},
    {"id": "ind-creators", "name": "Creators & Founders", "blurb": "Personal brand systems, content engines and monetization."},
]

SEED_PROJECTS = [
    {
        "title": "Northwind Agency OS",
        "summary": "Replaced 7 SaaS tools with one unified agency operating system.",
        "cover": "https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjB1aSUyMG1vY2t1cHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["agency", "crm", "automation"],
        "industry": "Creative Agencies",
        "client": "Northwind Creative",
        "body": "We unified pipeline, projects, time tracking and invoicing into a single founder dashboard. Delivery cycles dropped 38% and team admin time fell by 12 hours per week.",
    },
    {
        "title": "Atlas Health Patient Portal",
        "summary": "HIPAA-friendly portal with secure messaging and intake automation.",
        "cover": "https://images.pexels.com/photos/27141307/pexels-photo-27141307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["healthcare", "portal", "automation"],
        "industry": "Healthcare",
        "client": "Atlas Health",
        "body": "Patient intake forms now auto-create CRM records, schedule visits and trigger reminders. Manual front-desk work was cut by 60%.",
    },
    {
        "title": "Lumen SaaS Onboarding",
        "summary": "AI-driven onboarding flow that lifted activation by 41%.",
        "cover": "https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHN5c3RlbXMlMjBhdXRvbWF0aW9uJTIwdGVjaHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["saas", "onboarding", "ai"],
        "industry": "SaaS & Software",
        "client": "Lumen",
        "body": "A conversational AI guide replaced a 14-step setup wizard. Activation lifted from 32% to 73% and support tickets dropped by half.",
    },
    {
        "title": "Bowline Commerce Hub",
        "summary": "Unified order, support and retention automation across Shopify and Klaviyo.",
        "cover": "https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["ecommerce", "retention", "automation"],
        "industry": "E-commerce",
        "client": "Bowline Co.",
        "body": "Customer lifetime value rose 27% in 90 days through automated win-back, VIP and review flows.",
    },
    {
        "title": "Meridian Finance Dashboard",
        "summary": "Real-time exec dashboard pulling from QuickBooks, Stripe and Hubspot.",
        "cover": "https://images.unsplash.com/photo-1760978631985-590e3b5f4057?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMGRhcmslMjBsdXh1cnklMjB0ZWNoJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["finance", "dashboard", "data"],
        "industry": "Finance & Fintech",
        "client": "Meridian Capital",
        "body": "Daily exec reporting is now automated. Close-of-month went from 9 days to under 2.",
    },
    {
        "title": "Foundry Creators Suite",
        "summary": "Personal brand OS for a 500K-follower founder.",
        "cover": "https://images.pexels.com/photos/3612930/pexels-photo-3612930.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["creator", "content", "automation"],
        "industry": "Creators & Founders",
        "client": "Foundry",
        "body": "Content engine produces 18 multi-platform assets from a single recorded session each week.",
    },
]

SEED_CASE_STUDIES = [
    {
        "title": "How Northwind cut delivery time by 38%",
        "summary": "From 7 tools to 1 unified operating system in 6 weeks.",
        "cover": "https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjB1aSUyMG1vY2t1cHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["agency", "operations"],
        "metrics": [{"label": "Delivery time", "value": "-38%"}, {"label": "Admin hours", "value": "-12h/wk"}, {"label": "Client NPS", "value": "+24"}],
        "problem": "Northwind ran on 7 disconnected SaaS tools. Project status was unclear, billing was manual and retention was suffering.",
        "solution": "We mapped their delivery workflow, designed a unified pipeline + project + invoicing schema, and built a custom founder dashboard.",
        "result": "Within two cycles, delivery time dropped 38%, retention improved, and the leadership team reclaimed 12+ hours per week.",
    },
    {
        "title": "Lifting Lumen activation from 32% → 73%",
        "summary": "A conversational AI guide replaces a 14-step wizard.",
        "cover": "https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHN5c3RlbXMlMjBhdXRvbWF0aW9uJTIwdGVjaHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["saas", "ai"],
        "metrics": [{"label": "Activation", "value": "+41%"}, {"label": "Tickets", "value": "-52%"}, {"label": "Time to value", "value": "-63%"}],
        "problem": "Lumen's new users dropped off during a 14-step onboarding flow. Activation sat at 32% and support was overwhelmed.",
        "solution": "We designed an AI copilot that asks 3 questions and configures the workspace automatically.",
        "result": "Activation climbed to 73%, support tickets halved, and time-to-value dropped by 63%.",
    },
    {
        "title": "Atlas Health: 60% less front-desk work",
        "summary": "Automated patient intake & scheduling without breaking compliance.",
        "cover": "https://images.pexels.com/photos/27141307/pexels-photo-27141307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["healthcare", "portal"],
        "metrics": [{"label": "Front-desk time", "value": "-60%"}, {"label": "No-shows", "value": "-31%"}, {"label": "Patient CSAT", "value": "+19"}],
        "problem": "Atlas Health's front desk drowned in paperwork and reminders, with no-shows above 22%.",
        "solution": "We built a patient portal with secure intake forms, automated scheduling and SMS reminder workflows.",
        "result": "Front-desk admin time fell 60%, no-shows dropped 31%, and patient satisfaction rose substantially.",
    },
]

SEED_BLOG = [
    {
        "title": "The Founder OS — what it is and why every operator needs one",
        "excerpt": "A Founder OS is a single, opinionated workspace that ties together people, money, projects and content.",
        "body": "Most founders run their business out of 9 tabs and 4 group chats. A Founder OS replaces that with a single, opinionated workspace tied to the way *you* run. Here is the architecture I use with every client.",
        "cover": "https://images.unsplash.com/photo-1760978631985-590e3b5f4057?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMGRhcmslMjBsdXh1cnklMjB0ZWNoJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["founder", "systems"],
        "category": "Systems",
    },
    {
        "title": "n8n vs. Zapier vs. Make — a 2026 buyer's guide",
        "excerpt": "Which automation platform should your business actually run on this year?",
        "body": "Each platform has a sweet spot. Zapier wins on integrations breadth, Make wins on visual workflows, and n8n wins on ownership and AI. Here is how I choose for each engagement.",
        "cover": "https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["automation", "tools"],
        "category": "Automation",
    },
    {
        "title": "How I design dashboards founders actually open",
        "excerpt": "Dashboards die when they answer questions nobody asked. Here is the framework I use.",
        "body": "A founder dashboard is a *decision surface*, not a data dump. I design every dashboard around the 3 decisions the founder has to make this week.",
        "cover": "https://images.pexels.com/photos/27141307/pexels-photo-27141307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["dashboards", "design"],
        "category": "Design",
    },
    {
        "title": "Building AI copilots that don't hallucinate on your business",
        "excerpt": "A practical guide to grounding GPT-5 in your own knowledge base.",
        "body": "Most internal copilots fail because they live too far from your data. Here is the retrieval + guardrail pattern I ship in every engagement.",
        "cover": "https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHN5c3RlbXMlMjBhdXRvbWF0aW9uJTIwdGVjaHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85",
        "tags": ["ai", "copilots"],
        "category": "AI",
    },
    {
        "title": "The retainer model I use for systems work",
        "excerpt": "How to price ongoing systems work without trading hours for dollars.",
        "body": "I price retainers around outcomes and surface area, never hours. Here is the exact framework I use to scope, propose and renew.",
        "cover": "https://images.pexels.com/photos/3612930/pexels-photo-3612930.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "tags": ["pricing", "business"],
        "category": "Business",
    },
]

SEED_RESOURCES = [
    {"title": "Founder OS Notion Template", "type": "Template", "summary": "The exact Notion workspace I deploy with every founder client.", "url": "#", "cover": "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYXJjaGl0ZWN0dXJhbCUyMHdvcmtzcGFjZXxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85"},
    {"title": "Agency Pipeline Schema", "type": "Schema", "summary": "Stages, fields and automations for a modern agency CRM.", "url": "#", "cover": "https://images.pexels.com/photos/923307/pexels-photo-923307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"title": "Automation Audit Checklist", "type": "Checklist", "summary": "27 questions I ask to find $50K+ of automation in any business.", "url": "#", "cover": "https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"title": "Proposal Generator Prompt Pack", "type": "Prompts", "summary": "GPT-5 prompts that draft consulting proposals in minutes.", "url": "#", "cover": "https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHN5c3RlbXMlMjBhdXRvbWF0aW9uJTIwdGVjaHxlbnwwfHx8fDE3ODA4MzQwODR8MA&ixlib=rb-4.1.0&q=85"},
]

# ---------------------------------------------------------------------------
# AI Copilot system prompt
# ---------------------------------------------------------------------------
COPILOT_SYSTEM = """You are Noor — the AI copilot for Shamim Noor's platform.

Shamim Noor is a Business Systems Builder, Automation Architect, Agency Founder and Digital Solutions Consultant. He helps businesses build websites, CRM systems, client portals, dashboards, automation systems and modern business infrastructure.

His services include:
- Business Systems Design (from $4,800)
- Automation Architecture with n8n + AI (from $2,400)
- Client Portals & Dashboards (from $3,600)
- CRM & Pipeline Engineering (from $2,800)
- AI Copilots & Knowledge bases (from $3,200)
- Modern Web Experiences (from $3,000)

He serves SaaS, agencies, e-commerce, finance, healthcare, education, real estate and creators.

Your job:
1. Answer visitor questions warmly and concisely.
2. Explain Shamim's services and which fits the visitor's situation.
3. Qualify leads — ask about their company, goal, timeline and budget when relevant.
4. Suggest a free 20-minute consult when a visitor seems serious.
5. If asked to draft proposals, project summaries or recommendations, do it crisply.

Tone: confident, concise, premium, friendly. Format with short paragraphs and the occasional bullet list. Never invent client names. If asked something outside Shamim's scope, gently redirect to what he does."""

# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
async def seed_if_empty() -> None:
    # Founder user
    founder = await db.users.find_one({"email": FOUNDER_EMAIL})
    if not founder:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": FOUNDER_NAME,
            "email": FOUNDER_EMAIL,
            "password": hash_pw("ChangeMe!2026"),
            "role": "founder",
            "avatar": FOUNDER_AVATAR,
            "created_at": now_iso(),
        })

    if await db.services.count_documents({}) == 0:
        await db.services.insert_many([{**s, "created_at": now_iso()} for s in SEED_SERVICES])

    if await db.solutions.count_documents({}) == 0:
        await db.solutions.insert_many([{**s, "created_at": now_iso()} for s in SEED_SOLUTIONS])

    if await db.industries.count_documents({}) == 0:
        await db.industries.insert_many([{**s, "created_at": now_iso()} for s in SEED_INDUSTRIES])

    if await db.projects.count_documents({}) == 0:
        docs = []
        for p in SEED_PROJECTS:
            docs.append({
                "id": str(uuid.uuid4()),
                "slug": slugify(p["title"]),
                **p,
                "status": "published",
                "views": 0,
                "created_at": now_iso(),
            })
        await db.projects.insert_many(docs)

    if await db.case_studies.count_documents({}) == 0:
        docs = []
        for c in SEED_CASE_STUDIES:
            docs.append({
                "id": str(uuid.uuid4()),
                "slug": slugify(c["title"]),
                **c,
                "views": 0,
                "created_at": now_iso(),
            })
        await db.case_studies.insert_many(docs)

    if await db.blog.count_documents({}) == 0:
        docs = []
        for b in SEED_BLOG:
            docs.append({
                "id": str(uuid.uuid4()),
                "slug": slugify(b["title"]),
                **b,
                "status": "published",
                "author": {"name": FOUNDER_NAME, "avatar": FOUNDER_AVATAR},
                "views": 0,
                "read_time": max(2, len(b["body"].split()) // 200 + 3),
                "created_at": now_iso(),
                "published_at": now_iso(),
            })
        await db.blog.insert_many(docs)

    if await db.resources.count_documents({}) == 0:
        docs = [{"id": str(uuid.uuid4()), **r, "created_at": now_iso()} for r in SEED_RESOURCES]
        await db.resources.insert_many(docs)

def clean(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    doc.pop("_id", None)
    return doc

# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    role = "founder" if email == FOUNDER_EMAIL else "user"
    user = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": email,
        "password": hash_pw(payload.password),
        "role": role,
        "avatar": FOUNDER_AVATAR if role == "founder" else f"https://api.dicebear.com/9.x/initials/svg?seed={payload.name}",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = make_token(user["id"], user["email"], user["role"])
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password" and k != "_id"}}

@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Ensure founder role for founder email even if registered earlier
    if email == FOUNDER_EMAIL and user.get("role") != "founder":
        await db.users.update_one({"id": user["id"]}, {"$set": {"role": "founder", "avatar": FOUNDER_AVATAR}})
        user["role"] = "founder"
        user["avatar"] = FOUNDER_AVATAR
    token = make_token(user["id"], user["email"], user["role"])
    user.pop("_id", None)
    user.pop("password", None)
    return {"token": token, "user": user}

@api.get("/auth/me")
async def me(user: dict[str, Any] | None = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user}

# ---------------------------------------------------------------------------
# Public content routes
# ---------------------------------------------------------------------------
@api.get("/services")
async def list_services():
    items = await db.services.find({}, {"_id": 0}).to_list(100)
    return {"items": items}

@api.get("/solutions")
async def list_solutions():
    items = await db.solutions.find({}, {"_id": 0}).to_list(100)
    return {"items": items}

@api.get("/industries")
async def list_industries():
    items = await db.industries.find({}, {"_id": 0}).to_list(100)
    return {"items": items}

@api.get("/projects")
async def list_projects():
    items = await db.projects.find({"status": "published"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}

@api.get("/projects/{slug}")
async def get_project(slug: str):
    doc = await db.projects.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.projects.update_one({"slug": slug}, {"$inc": {"views": 1}})
    return doc

@api.get("/case-studies")
async def list_case_studies():
    items = await db.case_studies.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}

@api.get("/case-studies/{slug}")
async def get_case_study(slug: str):
    doc = await db.case_studies.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.case_studies.update_one({"slug": slug}, {"$inc": {"views": 1}})
    return doc

@api.get("/blog")
async def list_blog():
    items = await db.blog.find({"status": "published"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}

@api.get("/blog/{slug}")
async def get_blog(slug: str):
    doc = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.blog.update_one({"slug": slug}, {"$inc": {"views": 1}})
    return doc

@api.get("/resources")
async def list_resources():
    items = await db.resources.find({}, {"_id": 0}).to_list(200)
    return {"items": items}

# ---------------------------------------------------------------------------
# Social: likes, bookmarks, comments, share counts
# ---------------------------------------------------------------------------
@api.post("/social/like")
async def toggle_like(payload: LikeIn, request: Request, user: dict[str, Any] | None = Depends(get_current_user)):
    actor = user["id"] if user else f"anon:{anon_fingerprint(request)}"
    key = {"content_type": payload.content_type, "content_id": payload.content_id, "actor": actor}
    existing = await db.likes.find_one(key)
    if existing:
        await db.likes.delete_one(key)
        liked = False
    else:
        await db.likes.insert_one({**key, "created_at": now_iso()})
        liked = True
    count = await db.likes.count_documents({"content_type": payload.content_type, "content_id": payload.content_id})
    return {"liked": liked, "count": count}

@api.get("/social/stats")
async def social_stats(content_type: str, content_id: str, request: Request, user: dict[str, Any] | None = Depends(get_current_user)):
    actor = user["id"] if user else f"anon:{anon_fingerprint(request)}"
    likes = await db.likes.count_documents({"content_type": content_type, "content_id": content_id})
    liked = bool(await db.likes.find_one({"content_type": content_type, "content_id": content_id, "actor": actor}))
    bookmarked = False
    if user:
        bookmarked = bool(await db.bookmarks.find_one({"content_type": content_type, "content_id": content_id, "user_id": user["id"]}))
    comments = await db.comments.count_documents({"content_type": content_type, "content_id": content_id})
    return {"likes": likes, "liked": liked, "bookmarked": bookmarked, "comments": comments}

@api.post("/social/bookmark")
async def toggle_bookmark(payload: BookmarkIn, user: dict[str, Any] = Depends(require_user)):
    key = {"content_type": payload.content_type, "content_id": payload.content_id, "user_id": user["id"]}
    existing = await db.bookmarks.find_one(key)
    if existing:
        await db.bookmarks.delete_one(key)
        return {"bookmarked": False}
    await db.bookmarks.insert_one({**key, "title": payload.title or "", "created_at": now_iso()})
    return {"bookmarked": True}

@api.get("/social/bookmarks")
async def my_bookmarks(user: dict[str, Any] = Depends(require_user)):
    items = await db.bookmarks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}

@api.get("/social/comments")
async def list_comments(content_type: str, content_id: str):
    items = await db.comments.find({"content_type": content_type, "content_id": content_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"items": items}

@api.post("/social/comments")
async def create_comment(payload: CommentIn, user: dict[str, Any] = Depends(require_user)):
    comment = {
        "id": str(uuid.uuid4()),
        "content_type": payload.content_type,
        "content_id": payload.content_id,
        "body": payload.body.strip()[:2000],
        "user": {"id": user["id"], "name": user["name"], "avatar": user.get("avatar", "")},
        "created_at": now_iso(),
    }
    await db.comments.insert_one(comment)
    comment.pop("_id", None)
    return comment

# ---------------------------------------------------------------------------
# Leads / contact / hire
# ---------------------------------------------------------------------------
@api.post("/leads")
async def create_lead(payload: LeadIn):
    lead = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "status": "new",
        "created_at": now_iso(),
    }
    await db.leads.insert_one(lead)
    lead.pop("_id", None)
    return {"ok": True, "lead": lead}

@api.get("/admin/leads")
async def admin_list_leads(user: dict[str, Any] = Depends(require_founder)):
    items = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"items": items}

@api.patch("/admin/leads/{lead_id}")
async def admin_update_lead(lead_id: str, payload: dict[str, Any], user: dict[str, Any] = Depends(require_founder)):
    allowed = {k: v for k, v in payload.items() if k in {"status", "notes", "stage"}}
    await db.leads.update_one({"id": lead_id}, {"$set": allowed})
    return {"ok": True}

# ---------------------------------------------------------------------------
# Messaging (user <-> founder)
# ---------------------------------------------------------------------------
@api.post("/messages")
async def send_message(payload: MessageIn, user: dict[str, Any] = Depends(require_user)):
    # User sends to founder, or founder sends to a user thread
    if user.get("role") == "founder":
        if not payload.thread_user_id:
            raise HTTPException(400, "thread_user_id required for founder reply")
        thread_user_id = payload.thread_user_id
        from_id = user["id"]
        to_id = payload.thread_user_id
    else:
        thread_user_id = user["id"]
        from_id = user["id"]
        to_id = "founder"
    msg = {
        "id": str(uuid.uuid4()),
        "thread_user_id": thread_user_id,
        "from_id": from_id,
        "to_id": to_id,
        "from_name": user["name"],
        "from_avatar": user.get("avatar", ""),
        "body": payload.body.strip()[:4000],
        "created_at": now_iso(),
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    return msg

@api.get("/messages")
async def my_messages(user: dict[str, Any] = Depends(require_user)):
    if user.get("role") == "founder":
        # Return all threads grouped
        items = await db.messages.find({}, {"_id": 0}).sort("created_at", 1).to_list(2000)
        threads: dict[str, dict[str, Any]] = {}
        for m in items:
            tid = m["thread_user_id"]
            if tid not in threads:
                threads[tid] = {"thread_user_id": tid, "messages": [], "last": None, "user_name": m["from_name"] if m["from_id"] == tid else "User"}
            threads[tid]["messages"].append(m)
            threads[tid]["last"] = m["created_at"]
            if m["from_id"] == tid:
                threads[tid]["user_name"] = m["from_name"]
                threads[tid]["user_avatar"] = m.get("from_avatar", "")
        return {"threads": list(threads.values())}
    items = await db.messages.find({"thread_user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    return {"messages": items}

@api.get("/messages/thread/{thread_user_id}")
async def thread_messages(thread_user_id: str, user: dict[str, Any] = Depends(require_user)):
    if user.get("role") != "founder" and user["id"] != thread_user_id:
        raise HTTPException(403, "Forbidden")
    items = await db.messages.find({"thread_user_id": thread_user_id}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    return {"messages": items}

# ---------------------------------------------------------------------------
# AI Copilot (streaming)
# ---------------------------------------------------------------------------
async def stream_copilot(message: str, session_id: str):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    except Exception as e:
        yield f"data: I'm temporarily offline. Please email shamimnoorofficial@gmail.com and the team will respond.\n\n"
        yield "data: [DONE]\n\n"
        return

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=COPILOT_SYSTEM,
    ).with_model("openai", "gpt-5.2")

    try:
        async for ev in chat.stream_message(UserMessage(text=message)):
            if isinstance(ev, TextDelta):
                # SSE expects each chunk as one event; encode newlines safely
                chunk = ev.content.replace("\n", "\\n")
                yield f"data: {chunk}\n\n"
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        logger.exception("copilot stream error")
        yield f"data: \\n\\n(Sorry, the copilot hit an error. Please try again.)\n\n"
    yield "data: [DONE]\n\n"

@api.post("/copilot/stream")
async def copilot_stream(payload: CopilotIn):
    session_id = payload.session_id or str(uuid.uuid4())
    # Persist user message
    await db.copilot_logs.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": "user",
        "body": payload.message,
        "created_at": now_iso(),
    })
    return StreamingResponse(
        stream_copilot(payload.message, session_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )

# ---------------------------------------------------------------------------
# Founder: blog/project CRUD + analytics + command center
# ---------------------------------------------------------------------------
@api.post("/admin/blog")
async def admin_create_blog(payload: BlogIn, user: dict[str, Any] = Depends(require_founder)):
    doc = {
        "id": str(uuid.uuid4()),
        "slug": slugify(payload.title),
        **payload.model_dump(),
        "author": {"name": FOUNDER_NAME, "avatar": FOUNDER_AVATAR},
        "views": 0,
        "read_time": max(2, len(payload.body.split()) // 200 + 2),
        "created_at": now_iso(),
        "published_at": now_iso() if payload.status == "published" else None,
    }
    await db.blog.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/admin/blog/{post_id}")
async def admin_update_blog(post_id: str, payload: dict[str, Any], user: dict[str, Any] = Depends(require_founder)):
    allowed = {k: v for k, v in payload.items() if k in {"title", "excerpt", "body", "cover", "tags", "category", "status"}}
    if "title" in allowed:
        allowed["slug"] = slugify(allowed["title"])
    await db.blog.update_one({"id": post_id}, {"$set": allowed})
    return {"ok": True}

@api.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, user: dict[str, Any] = Depends(require_founder)):
    await db.blog.delete_one({"id": post_id})
    return {"ok": True}

@api.post("/admin/projects")
async def admin_create_project(payload: ProjectIn, user: dict[str, Any] = Depends(require_founder)):
    doc = {
        "id": str(uuid.uuid4()),
        "slug": slugify(payload.title),
        **payload.model_dump(),
        "views": 0,
        "created_at": now_iso(),
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/admin/projects/{pid}")
async def admin_update_project(pid: str, payload: dict[str, Any], user: dict[str, Any] = Depends(require_founder)):
    allowed = {k: v for k, v in payload.items() if k in {"title", "summary", "body", "cover", "tags", "industry", "client", "status"}}
    if "title" in allowed:
        allowed["slug"] = slugify(allowed["title"])
    await db.projects.update_one({"id": pid}, {"$set": allowed})
    return {"ok": True}

@api.delete("/admin/projects/{pid}")
async def admin_delete_project(pid: str, user: dict[str, Any] = Depends(require_founder)):
    await db.projects.delete_one({"id": pid})
    return {"ok": True}

@api.get("/admin/overview")
async def admin_overview(user: dict[str, Any] = Depends(require_founder)):
    users_count = await db.users.count_documents({})
    leads_count = await db.leads.count_documents({})
    new_leads = await db.leads.count_documents({"status": "new"})
    projects_count = await db.projects.count_documents({})
    posts_count = await db.blog.count_documents({})
    messages_count = await db.messages.count_documents({})
    comments_count = await db.comments.count_documents({})
    likes_count = await db.likes.count_documents({})

    # Compute view totals
    posts = await db.blog.find({}, {"_id": 0, "views": 1, "title": 1, "slug": 1}).to_list(500)
    projects = await db.projects.find({}, {"_id": 0, "views": 1, "title": 1, "slug": 1}).to_list(500)
    total_views = sum(p.get("views", 0) for p in posts) + sum(p.get("views", 0) for p in projects)

    top_posts = sorted(posts, key=lambda x: x.get("views", 0), reverse=True)[:5]
    top_projects = sorted(projects, key=lambda x: x.get("views", 0), reverse=True)[:5]

    # Fake revenue for demo (no payments yet)
    revenue = leads_count * 1850

    return {
        "kpis": {
            "users": users_count,
            "leads": leads_count,
            "new_leads": new_leads,
            "projects": projects_count,
            "posts": posts_count,
            "messages": messages_count,
            "comments": comments_count,
            "likes": likes_count,
            "views": total_views,
            "revenue": revenue,
        },
        "top_posts": top_posts,
        "top_projects": top_projects,
    }

@api.get("/admin/analytics")
async def admin_analytics(user: dict[str, Any] = Depends(require_founder)):
    # Build last 14 days timeseries from leads/comments/messages
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)) for i in range(13, -1, -1)]
    series = []
    for d in days:
        start = datetime(d.year, d.month, d.day, tzinfo=timezone.utc).isoformat()
        end = (datetime(d.year, d.month, d.day, tzinfo=timezone.utc) + timedelta(days=1)).isoformat()
        leads = await db.leads.count_documents({"created_at": {"$gte": start, "$lt": end}})
        msgs = await db.messages.count_documents({"created_at": {"$gte": start, "$lt": end}})
        comments = await db.comments.count_documents({"created_at": {"$gte": start, "$lt": end}})
        likes = await db.likes.count_documents({"created_at": {"$gte": start, "$lt": end}})
        series.append({
            "date": d.isoformat(),
            "leads": leads,
            "messages": msgs,
            "comments": comments,
            "likes": likes,
            "visits": leads * 14 + msgs * 6 + comments * 4 + likes * 2 + 12,  # synthesised
        })
    sources = [
        {"name": "Direct", "value": 38},
        {"name": "LinkedIn", "value": 22},
        {"name": "X / Twitter", "value": 14},
        {"name": "YouTube", "value": 11},
        {"name": "Newsletter", "value": 9},
        {"name": "Referral", "value": 6},
    ]
    return {"series": series, "sources": sources}

@api.post("/admin/command")
async def admin_command(payload: CommandIn, user: dict[str, Any] = Depends(require_founder)):
    """
    Natural-language command center. Tries to parse intent, executes safe ops,
    otherwise routes the prompt through the LLM copilot for a response.
    """
    prompt = payload.prompt.strip()
    lower = prompt.lower()

    # 1. Show leads
    if "show leads" in lower or "list leads" in lower:
        leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
        return {"intent": "list_leads", "result": leads}

    # 2. Show active projects
    if "show projects" in lower or "active projects" in lower:
        items = await db.projects.find({"status": "published"}, {"_id": 0}).to_list(50)
        return {"intent": "list_projects", "result": items}

    # 3. Show analytics
    if "show analytics" in lower or "analytics" in lower:
        return {"intent": "analytics", "result": await admin_analytics(user)}

    # 4. Create blog draft
    m = re.match(r"(?:create|write|draft) (?:a )?blog(?: post)? (?:about|on) (.+)", lower)
    if m:
        topic = m.group(1).strip().strip(".").strip('"')
        # Use LLM to draft
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"cmd-{uuid.uuid4().hex[:8]}",
                system_message="You are Shamim Noor's editorial assistant. Draft a concise, premium blog post in markdown with a title, 2-3 paragraph excerpt and 300-500 word body.",
            ).with_model("openai", "gpt-5.2")
            resp = await chat.send_message(UserMessage(text=f"Draft a blog post about: {topic}"))
            text = getattr(resp, "text", str(resp))
        except Exception as e:
            text = f"# {topic.title()}\n\nDraft generation is offline right now."
        # Persist as draft
        title = topic.title()[:80]
        doc = {
            "id": str(uuid.uuid4()),
            "slug": slugify(title),
            "title": title,
            "excerpt": text.split("\n")[0][:200],
            "body": text,
            "tags": [],
            "category": "Drafts",
            "status": "draft",
            "author": {"name": FOUNDER_NAME, "avatar": FOUNDER_AVATAR},
            "views": 0,
            "read_time": max(2, len(text.split()) // 200 + 2),
            "created_at": now_iso(),
            "published_at": None,
        }
        await db.blog.insert_one(doc)
        doc.pop("_id", None)
        return {"intent": "draft_blog", "result": doc, "message": f"Drafted '{title}' and saved to drafts."}

    # 5. Generate a proposal
    if "generate proposal" in lower or "draft proposal" in lower or "proposal for" in lower:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"prop-{uuid.uuid4().hex[:8]}",
                system_message="You are a proposal writer for Shamim Noor, an automation architect. Write a tight, premium 1-page proposal with sections: Context, Approach, Deliverables, Timeline, Investment.",
            ).with_model("openai", "gpt-5.2")
            resp = await chat.send_message(UserMessage(text=prompt))
            text = getattr(resp, "text", str(resp))
        except Exception:
            text = "Proposal generation is offline right now."
        return {"intent": "proposal", "result": text}

    # 6. Fallback: LLM general response
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"cmd-{uuid.uuid4().hex[:8]}",
            system_message="You are the command-center for Shamim Noor's founder OS. Respond concisely with action-oriented answers.",
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"intent": "chat", "result": getattr(resp, "text", str(resp))}
    except Exception:
        return {"intent": "chat", "result": "Command received. (LLM offline — try again shortly.)"}

# ---------------------------------------------------------------------------
# Community feed (simple)
# ---------------------------------------------------------------------------
class CommunityPostIn(BaseModel):
    body: str

@api.get("/community/posts")
async def list_community_posts():
    items = await db.community.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": items}

@api.post("/community/posts")
async def create_community_post(payload: CommunityPostIn, user: dict[str, Any] = Depends(require_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "body": payload.body.strip()[:1000],
        "user": {"id": user["id"], "name": user["name"], "avatar": user.get("avatar", "")},
        "created_at": now_iso(),
    }
    await db.community.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"ok": True, "service": "shamim-noor-founder-os", "founder": FOUNDER_NAME}

# ---------------------------------------------------------------------------
# Mount + middleware + startup
# ---------------------------------------------------------------------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await seed_if_empty()
    logger.info("Seed complete. Founder = %s", FOUNDER_EMAIL)

@app.on_event("shutdown")
async def on_shutdown():
    client.close()
