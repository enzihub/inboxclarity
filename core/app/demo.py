# app/demo.py
"""Demo mode: run InboxClarity end to end with no Google, Supabase, Gemini or Mailtrap account.

Set DEMO_MODE=1. The invented inbox in demo/inbox.json replaces Gmail, a canned model
response in demo/brief.html replaces the Gemini call, and finished briefs are written to
demo/outbox/ instead of being emailed. Every person, company and address in demo/ is fictional.
"""
import base64
import html
import json
import os
from datetime import datetime
from pathlib import Path

import jinja2
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
ROOT = Path(__file__).resolve().parent.parent
DEMO_DIR = ROOT / "demo"
router = APIRouter(prefix="/demo", tags=["demo"])
_preferences: dict = {}


def load_demo_messages() -> list[dict]:
    """Return the invented inbox in the same shape get_unread_emails() returns from Gmail."""
    raw = json.loads((DEMO_DIR / "inbox.json").read_text(encoding="utf-8"))
    out = []
    for i, m in enumerate(raw):
        out.append({
            "id": f"demo-{i}",
            "subject": m["subject"],
            "from": m["from"],
            "date": m["date"],
            # Gmail returns base64url bodies; keep that so the real preprocess step runs
            "body": base64.urlsafe_b64encode(m["body"].encode()).decode().rstrip("="),
        })
    return out


async def build_demo_prompt() -> str:
    """Run the invented inbox through the real preprocessing and the real summary prompt."""
    from app.ai.prompts import GMAIL_SUMMARY_PROMPT
    from app.gmail.gmail import preprocess_messages

    processed = await preprocess_messages(load_demo_messages())
    return GMAIL_SUMMARY_PROMPT.format(content=processed, date=datetime.now(), user_name="InboxClarity")


def stub_model_response(prompt: str) -> str:
    """Stand-in for the Gemini call: a fixed brief written for the invented inbox."""
    assert "Email Threads" in prompt
    return (DEMO_DIR / "brief.html").read_text(encoding="utf-8")


def render_brief(summary_html: str, prep_for: str = "Maya Chen") -> str:
    env = jinja2.Environment(loader=jinja2.FileSystemLoader(ROOT / "templates"), autoescape=True)
    return env.get_template("newsletter.html").render(
        title="Morning Brief",
        summary=summary_html,
        logo_data=os.getenv("LOGO_URL", ""),
        settings_url=os.getenv("APP_SETTINGS_URL", ""),
        prep_for=prep_for,
        prep_by="InboxClarity",
        timestamp=datetime(2025, 10, 14).strftime("%B %d, %Y"),
    )


async def demo_generate() -> dict:
    prompt = await build_demo_prompt()
    summary = stub_model_response(prompt)
    return {"html_content": render_brief(summary), "subject_line": "Staging decision due today, launch copy by Thursday"}


async def demo_send_newsletter(email: str) -> Path:
    content = await demo_generate()
    outbox = DEMO_DIR / "outbox"
    outbox.mkdir(exist_ok=True)
    path = outbox / f"brief-{datetime.now().strftime('%Y%m%d-%H%M%S')}.html"
    path.write_text(content["html_content"], encoding="utf-8")
    return path


def demo_save_preferences(user_id: str, preferences) -> dict:
    row = {"user_id": user_id, "preferred_hour": preferences.preferred_hour, "timezone": preferences.timezone}
    _preferences[user_id] = row
    return row


@router.get("/inbox")
async def demo_inbox():
    """The invented unread emails the demo brief is built from."""
    return json.loads((DEMO_DIR / "inbox.json").read_text(encoding="utf-8"))


@router.get("/prompt", response_class=HTMLResponse)
async def demo_prompt():
    """The exact prompt the real pipeline would send to the model."""
    return "<pre style='white-space:pre-wrap'>" + html.escape(await build_demo_prompt()) + "</pre>"


@router.get("/brief", response_class=HTMLResponse)
async def demo_brief():
    """The rendered Morning Brief email for the invented inbox."""
    return (await demo_generate())["html_content"]
