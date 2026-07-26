import time
import os

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api import router as api_router, admin_settings, trends_service
from services.email_service import EmailService
import asyncio
from datetime import datetime

app = FastAPI(title="Shopee Product Selection API")
email_service = EmailService()

# Define the background scheduler task
async def scheduler_task():
    print("[Scheduler] Background automation task started.")
    last_run_date = None
    while True:
        try:
            auto_config = admin_settings.get("automation", {})
            if auto_config.get("enable_scheduler"):
                schedule_time_str = auto_config.get("schedule_time", "08:00")
                now = datetime.now()
                current_time_str = now.strftime("%H:%M")
                current_date_str = now.strftime("%Y-%m-%d")
                
                # Check if it's the right time and we haven't run today
                if current_time_str == schedule_time_str and last_run_date != current_date_str:
                    print(f"[Scheduler] Triggering daily crawler at {current_time_str}")
                    
                    # 1. Run crawler
                    trends_data = trends_service.get_trending_shopping_keywords()
                    
                    # 2. Send Email if enabled
                    if auto_config.get("enable_email"):
                        email_service.send_daily_report(
                            smtp_email=auto_config.get("smtp_email"),
                            smtp_password=auto_config.get("smtp_password"),
                            target_emails=auto_config.get("target_emails"),
                            trends_data=trends_data
                        )
                    
                    # Mark as run for today
                    last_run_date = current_date_str
        except Exception as e:
            print(f"[Scheduler] Error in loop: {e}")
            
        await asyncio.sleep(60) # check every minute

@app.on_event("startup")
async def startup_event():
    print("[System] Application starting up.")
    asyncio.create_task(scheduler_task())
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Serve React build files
import sys
if getattr(sys, 'frozen', False):
    frontend_dist = os.path.join(sys._MEIPASS, "frontend", "dist")
else:
    frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_react_app(full_path: str):
        # Fallback for client-side routing
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"status": "ok", "message": "API is running. Frontend build not found."}
