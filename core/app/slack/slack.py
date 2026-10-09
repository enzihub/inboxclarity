import asyncio
import logging
import os
import time
from datetime import datetime
from typing import List, Dict

from dotenv import load_dotenv
from fastapi import HTTPException
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.signature import SignatureVerifier
from slack_sdk.web.async_client import AsyncWebClient

from app.ai.prompts import SLACK_SUMMARY_PROMPT
from app.database.supabase_connection import get_supabase_client
import google.generativeai as genai

from app.schemas import UserToken

load_dotenv()

# In-memory cache for users
users_cache = {}
users_cache_expiry = None
CACHE_TTL = 3600  # 1 hour
SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET", "")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")


class _UnconfiguredVerifier:
    """Rejects every Slack request when SLACK_SIGNING_SECRET is not set."""

    def is_valid_request(self, body, headers) -> bool:
        return False


signature_verifier = SignatureVerifier(signing_secret=SLACK_SIGNING_SECRET) if SLACK_SIGNING_SECRET else _UnconfiguredVerifier()
slack_client = WebClient(token=SLACK_BOT_TOKEN)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

model = genai.GenerativeModel("gemini-2.0-flash-exp")


async def generate_slack_summary(user_token:UserToken):
    try:
        # Get the user's Slack token first
        # supabase = await get_supabase_client()
        # response = await supabase.table('user_slack_tokens') \
        #     .select('s_provider_token') \
        #     .eq('id', user_token.id) \
        #     .single() \
        #     .execute()

        # user_token = response.data['s_provider_token']
        all_messages = await get_all_user_messages(user_token)

        # Pass the user's token to get_user_slack_mapping
        processed_messages = await preprocess_messages(all_messages, user_token)

        prompt = SLACK_SUMMARY_PROMPT.format(content=processed_messages,
                                             date=datetime.now(),
                                             user_name="InboxClarity")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        cleaned_text = raw_text

        # Remove backticks and check for html tags
        if raw_text.startswith('```html'):
            cleaned_text = raw_text[7:-3].strip()  # Remove ```html and ending ```
        return cleaned_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def preprocess_messages(messages, user_token=None):
    # Get users mapping for the specific workspace
    users_json = await get_user_slack_mapping(user_token.s_provider_token)
    processed_messages = "\n".join(
        [
            f"{users_json.get(msg['user'], 'Unknown User')}: {replace_mentions(msg['text'].strip(), users_json)}"
            for msg in messages
            if msg.get('user')
        ]
    )
    return processed_messages


async def process_summary(channel_id, option, user_id):
    try:
        now = datetime.now()
        timestamp = now.strftime("%m/%d/%y %H:%M:%S")

        # Get conversation history from Slack
        conversation_history = slack_client.conversations_history(
            channel=channel_id, limit=20
        )
        messages = conversation_history.get("messages", [])

        processed_messages = await preprocess_messages(messages)

        # Format the prompt using the template
        prompt = SLACK_SUMMARY_PROMPT.format(content=processed_messages)

        # Generate summary using your OpenAI client
        # response = await openai.generate_content(prompt=prompt)
        response = model.generate_content(prompt)
        response = response.text

        summary = response.strip()

        # Post the summary to Slack
        if option["ephemeral"]:
            slack_client.chat_postEphemeral(
                channel=channel_id,
                text=f"*{timestamp}*\n{summary}",
                user=user_id,
            )
        else:
            slack_client.chat_postMessage(
                channel=channel_id,
                text=f"*{timestamp}*\n{summary}",
            )

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_user_slack_mapping(token: str = None):
    """
    Get user mapping for a specific workspace using the provided token
    or default bot token if none provided
    """
    client = WebClient(token=token) if token else slack_client

    try:
        # First, get the workspace ID
        auth_response = client.auth_test()
        workspace_id = auth_response["team_id"]

        # Check if we have a valid cache for this workspace
        cache_data = users_cache.get(workspace_id)
        if cache_data and cache_data['expiry'] > time.time():
            return cache_data['users']

        # Fetch all users from Slack API
        response = client.users_list()
        users = response.get("members", [])

        # Filter active users and build the mapping
        active_users_dict = {
            user["id"]: user["real_name"].split()[0].capitalize()
            for user in users
            if not user.get("deleted", False) and not user.get("is_bot", False)
        }

        # Update cache for this specific workspace
        users_cache[workspace_id] = {
            'users': active_users_dict,
            'expiry': time.time() + CACHE_TTL
        }

        return active_users_dict
    except SlackApiError as e:
        logger.error(f"Error fetching users: {e.response['error']}")
        raise e


def replace_mentions(text, users_json):
    """
    Replace all mentions (<@USER_ID>) in the message text with the corresponding user names.
    """
    for user_id in users_json:
        mention = f"<@{user_id}>"
        if mention in text:
            text = text.replace(mention, users_json[user_id])
    return text


async def get_all_user_messages(token: UserToken) -> List[Dict]:
    """Fetch all messages from all channels for a user within the last 24 hours"""
    try:
        # Get user token from Supabase
        supabase = await get_supabase_client()
        # response = await supabase.table('user_slack_tokens') \
        #     .select('s_provider_token') \
        #     .eq('id', user_id) \
        #     .single() \
        #     .execute()

        # client = AsyncWebClient(token=response.data['s_provider_token'])
        client = AsyncWebClient(token=token.s_provider_token)

        # Calculate timestamp for 24 hours ago
        oldest_timestamp = str(int(time.time() - 24 * 60 * 60))

        # Fetch all conversations in parallel
        conversations_response = await client.users_conversations(
            types="public_channel,private_channel",
            limit=1000,
            exclude_archived=True
        )

        channels = conversations_response.get('channels', [])

        # Create tasks for all channels
        tasks = [
            fetch_channel_messages(
                client=client,
                channel_id=channel['id'],
                channel_name=channel.get('name', 'Unknown'),
                oldest_timestamp=oldest_timestamp
            )
            for channel in channels
        ]

        # Execute all tasks concurrently with rate limiting
        all_channel_messages = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten and filter out errors
        all_messages = []
        for result in all_channel_messages:
            if isinstance(result, list):
                all_messages.extend(result)
            else:
                logger.error(f"Error fetching messages: {str(result)}")

        # Sort messages by timestamp
        all_messages.sort(key=lambda x: float(x['timestamp']), reverse=True)

        logger.info(f"Retrieved {len(all_messages)} messages from {len(channels)} channels")
        return all_messages

    except Exception as e:
        logger.error(f"Error fetching messages for user {token.id}: {str(e)}")
        raise


async def fetch_channel_messages(
        client: AsyncWebClient,
        channel_id: str,
        channel_name: str,
        oldest_timestamp: str
) -> List[Dict]:
    """Fetch all messages from a single channel with pagination handling"""
    messages = []
    cursor = None

    # Semaphore for rate limiting (3 requests per second)
    async with asyncio.Semaphore(3):
        while True:
            try:
                await asyncio.sleep(0.35)  # Rate limit: ~3 requests per second

                response = await client.conversations_history(
                    channel=channel_id,
                    cursor=cursor,
                    oldest=oldest_timestamp,
                    limit=100  # Maximum allowed by Slack API
                )

                if not response['ok']:
                    logger.error(f"Error in channel {channel_name}: {response.get('error')}")
                    break

                # Process messages
                channel_messages = [
                    {
                        'channel_name': channel_name,
                        'user': msg.get('user'),
                        'text': msg.get('text', '').strip(),
                        'timestamp': msg.get('ts'),
                        'thread_ts': msg.get('thread_ts'),
                        'replies_count': msg.get('reply_count', 0)
                    }
                    for msg in response.get('messages', [])
                    if msg.get('text')  # Filter out empty messages
                ]

                messages.extend(channel_messages)

                # Handle pagination
                if response.get('has_more'):
                    cursor = response['response_metadata']['next_cursor']
                else:
                    break

            except Exception as e:
                logger.error(f"Error fetching messages for channel {channel_name}: {str(e)}")
                break

    return messages
