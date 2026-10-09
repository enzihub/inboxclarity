# app/routes.py
import pytz

from fastapi import APIRouter, HTTPException, BackgroundTasks
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.database.supabase_connection import get_supabase_client
from app.newsletter.newsletter import process_newsletter_task
from app.schemas import NewsletterRequest, NewsletterPreference
from app.slack.slack import process_summary, signature_verifier
from app.demo import DEMO_MODE, demo_send_newsletter, demo_save_preferences

router = APIRouter()


@router.post("/send-newsletter")
async def send_newsletter(request: NewsletterRequest, background_tasks: BackgroundTasks):
    """Endpoint to trigger newsletter generation and sending for a specific user"""
    try:
        # Minimal validation
        if not request.email:
            raise HTTPException(status_code=400, detail="Email is required")

        # Add to background tasks (demo mode writes the brief to demo/outbox instead of emailing it)
        if DEMO_MODE:
            background_tasks.add_task(demo_send_newsletter, request.email)
        else:
            background_tasks.add_task(process_newsletter_task, request.email, None)

        return {
            "status": "success",
            "message": f"Newsletter generation queued for {request.email}"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.patch("/users/{user_id}/newsletter-preferences")
async def update_newsletter_preferences(
        user_id: str,
        preferences: NewsletterPreference
):
    try:
        # Validate timezone
        if preferences.timezone not in pytz.all_timezones:
            raise HTTPException(status_code=400, detail="Invalid timezone")

        # Validate hour (0-23)
        if not 0 <= preferences.preferred_hour <= 23:
            raise HTTPException(status_code=400, detail="Hour must be between 0 and 23")

        if DEMO_MODE:
            return {"status": "success", "data": demo_save_preferences(user_id, preferences)}

        # Update preferences in Supabase
        supabase = await get_supabase_client()
        result = await supabase.table('inboxclarity_user_newsletters') \
            .update({
                'preferred_hour': preferences.preferred_hour,
                'timezone': preferences.timezone,
            }) \
            .eq('user_id', user_id) \
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="User newsletter preferences not found")

        return {"status": "success", "data": result.data[0]}

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def root():
    return {"service": "inboxclarity-core", "status": "ok"}


@router.post("/health")
async def health_check(request: Request):
    body = await request.body()
    if not signature_verifier.is_valid_request(body, request.headers):
        raise HTTPException(status_code=400, detail="Invalid Slack request")
    return {
        "response_type": "in_channel",
        "text": "All engines are running smoothly! 🚀🚀🚀",
    }


@router.post("/news")
async def get_summary(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    form_data = await request.form()

    if not signature_verifier.is_valid_request(body, request.headers):
        raise HTTPException(status_code=400, detail="Invalid Slack request")

    # Extract Slack command and options
    command_text = form_data.get("text", "").strip()
    channel_id = form_data.get("channel_id")
    user_id = form_data.get("user_id")

    options = {
        "0": {"ephemeral": True, "message_prefix": ""},
        "1": {"ephemeral": False, "message_prefix": ""},
    }

    selected_option = options.get(command_text.lower(), options["0"])
    background_tasks.add_task(process_summary, channel_id, selected_option, user_id)

    return JSONResponse(
        {"response_type": "ephemeral", "text": "Processing your request..."},
        status_code=200,
    )
