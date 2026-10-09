# credentials.py

import logging
import os
import httpx

from typing import Optional
from fastapi import HTTPException
from app.schemas import UserToken
from app.database.supabase_connection import get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Set APScheduler logger to WARNING level to reduce verbosity
logging.getLogger('apscheduler').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Get credentials from environment variables
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')


async def check_token_validity(access_token: str) -> tuple[bool, Optional[int]]:
    """Check if access token is valid and return its expiry"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v1/tokeninfo",
            params={"access_token": access_token}
        )

        if response.status_code != 200:
            return False, None

        data = response.json()
        return True, int(data.get("expires_in", 0))


async def refresh_access_token(token_info: UserToken) -> Optional[str]:
    """Get new access token using refresh token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "refresh_token": token_info.g_provider_refresh_token,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "grant_type": "refresh_token",
            }
        )

        if response.status_code != 200:
            return None

        return response.json()["access_token"]


async def update_user_tokens(user_id: str, new_access_token: str) -> None:
    """
    Update user's tokens in the database after refresh.

    Args:
        user_id: The user's unique identifier
        new_access_token: The newly refreshed access token

    Raises:
        HTTPException: If database update fails
    """
    try:
        supabase = await get_supabase_client()

        # Update the user's tokens in the database
        result = await supabase.table('user_google_tokens').update({
            'g_provider_token': new_access_token,
        }).eq('id', user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update user tokens in database"
            )

        logger.info(f"Successfully updated tokens for user {user_id}")

    except Exception as e:
        logger.error(f"Error updating tokens for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update tokens: {str(e)}"
        )


async def get_valid_credentials(token_info: UserToken) -> str:
    """
    Get a valid access token, refreshing if necessary and updating the database.
    Returns valid access token (either existing or newly refreshed).
    Raises ValueError if unable to get valid token.
    """
    # First check if current token is valid
    is_valid, expires_in = await check_token_validity(token_info.g_provider_token)

    # If token is valid and not expired (expires_in > 0), return it
    if is_valid and expires_in and expires_in > 0:
        return token_info.g_provider_token

    # Token is invalid or expired, try to refresh
    new_token = await refresh_access_token(token_info)
    if not new_token:
        raise ValueError("Failed to refresh access token")

    # Verify the new token is valid
    is_valid, _ = await check_token_validity(new_token)
    if not is_valid:
        raise ValueError("Newly refreshed token is invalid")

    # Update the database with the new token
    await update_user_tokens(token_info.id, new_token)

    return new_token