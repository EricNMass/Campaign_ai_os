from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.db import init_db
from backend.app.api import auth, campaigns, executions, agents, devops, reports

# 1. Initialize Database
print("[App] Initializing Local Database schema...")
init_db()

app = FastAPI(
    title="Campaign Automation Agentic AI Operating System",
    description="Enterprise Multi-Agent Orchestration & Browser Automation OS",
    version="1.0.0"
)

# 2. CORS Configurations (Allow Vite Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount static directory for screenshots, videos, and logs
app.mount("/static", StaticFiles(directory=settings.STORAGE_DIR), name="static")
print(f"[App] Static directory mounted: {settings.STORAGE_DIR} -> /static")

# 4. Attach API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")
app.include_router(executions.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(devops.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "Campaign Automation AI OS",
        "api_docs": "/docs"
    }
