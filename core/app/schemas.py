# schemas.py

from dataclasses import dataclass
from typing import Optional
from pydantic import BaseModel


class NewsletterRequest(BaseModel):
    email: str


class NewsletterPreference(BaseModel):
    preferred_hour: int
    timezone: str

    class Config:
        json_schema_extra = {
            "example": {
                "preferred_hour": 8,
                "timezone": "Asia/Colombo"
            }
        }


@dataclass
class NewsletterSubscriber:
    user_id: str
    email: str
    timezone: str
    preferred_hour: int
    calculated_utc_time: str


class VideoInfo(BaseModel):
    title: str
    url: str
    video_id: str
    channel_name: Optional[str] = None


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


@dataclass
class UserToken:
    id: str
    email: str
    g_provider_token: str
    g_provider_refresh_token: str
    created_at: str
    updated_at: str
