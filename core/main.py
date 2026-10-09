import logging
import os

import google.generativeai as genai
import sentry_sdk

from dotenv import load_dotenv
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.newsletter.scheduler import NewsletterScheduler
from app.routes import router
from app.demo import DEMO_MODE, router as demo_router

load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Set APScheduler logger to WARNING level to reduce verbosity
logging.getLogger('apscheduler').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=1.0)

app = FastAPI()

scheduler = NewsletterScheduler()

if os.getenv('GEMINI_API_KEY'):
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Include the router
app.include_router(router)
if DEMO_MODE:
    app.include_router(demo_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    if DEMO_MODE:
        logger.info("DEMO_MODE is on: using the invented inbox in demo/, no scheduler, no Supabase.")
        return
    logger.info("Starting up scheduler...")
    await scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    if DEMO_MODE:
        return
    logger.info("Shutting down scheduler...")
    scheduler.shutdown()
    logger.info("Scheduler shut down successfully")


