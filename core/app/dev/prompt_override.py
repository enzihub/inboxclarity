# prompt_override.py

from typing import Optional
from pydantic import BaseModel

from app.ai.prompts import TRANSCRIPT_SUMMARY_PROMPT


class PromptTestRequest(BaseModel):
    """Request schema for testing newsletter generation with custom prompt"""
    email: str
    prompt: str

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "user@example.com",
                "prompt": """Using the existing information > turn this into a summary of the video, but not in the style of a summary, a style of the first person talking about it like the news > and feel free to do it in the style first person of the information I gave to you

Title: {video_title}
URL: {video_url}

Content:
{transcript_text}"""
            }]
        }
    }


class PromptOverride:
    current_prompt: Optional[str] = None

    @classmethod
    def set_prompt(cls, prompt: str):
        cls.current_prompt = prompt

    @classmethod
    def get_prompt(cls) -> str:
        return cls.current_prompt or TRANSCRIPT_SUMMARY_PROMPT
