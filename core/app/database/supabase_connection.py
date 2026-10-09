# supabase_connection.py

import logging
import os

from dotenv import load_dotenv
from supabase._async.client import AsyncClient as Client, create_client

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def get_supabase_client() -> Client:
    """Initialize and return Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

    # Create client without custom options
    return await create_client(url, key)


# TODO: This function can be refactored to get user's subscription entitlements/features later on.
# TODO: handle whatever free/premium features are present for focusgate


