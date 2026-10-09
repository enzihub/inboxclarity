# app/newsletter.py

import logging
import os
import pytz
import jinja2
import inflect

from pathlib import Path
from datetime import datetime
from typing import Dict, Optional
from fastapi import HTTPException
from app.ai.openai import openai
from app.ai.prompts import SUBJECT_LINE_PROMPT
from app.database.supabase_connection import get_supabase_client
from app.gmail.gmail import generate_gmail_summary
from app.subscription.check_subscription import get_user_subscriptions
from app.dev.prompt_override import PromptOverride
from app.emailing.email_service import EmailService
from app.schemas import UserToken
from app.slack.slack import generate_slack_summary
import google.generativeai as genai

p = inflect.engine()

MAX_RECOMMENDATION_RETRIES = 3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

model = genai.GenerativeModel("gemini-2.0-flash-exp")

async def generate_newsletter_content(user_token: UserToken) -> Optional[Dict]:
    # Call the slack API to get user data.
    try:
        logger.info(f"Generating newsletter content. This will take a while...")
        # Get user subscriptions and determine premium status
        # subscriptions = await get_user_subscriptions(user_token.id)
        subscriptions = await get_user_subscriptions(user_token.email)
        is_premium = bool(subscriptions)  # True if any active subscriptions exist

        # TODO: add more sophisticated checks if needed.
        # We only allow premium users to get newsletters.
        if not is_premium:
            raise ValueError('Not Subscribed to any premium plans')

        summary_content = await generate_gmail_summary(user_token)

        template_dir = Path(__file__).parent.parent.parent / 'templates'
        template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir),
            autoescape=True
        )
        template = template_env.get_template('newsletter.html')

        # Time
        # User TZ
        # Add the date time in user timezone
        supabase = await get_supabase_client()
        response = await supabase.table('inboxclarity_user_newsletters').select('*').eq('user_id', user_token.id).execute()
        if not response.data:
            logger.error(f"User newsletter preferences not found for {user_token.email}")
            return
        user_newsletter_row = response.data[0]
        user_timezone = pytz.timezone(user_newsletter_row['timezone'])

        user_tz = user_timezone
        now = datetime.now().astimezone(user_tz)
        # day_of_week = now.strftime("%A")
        # date = f"{now.strftime('%b')} {p.ordinal(now.day)}"
        # timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        timestamp = now.strftime("%B %d, %Y")

        # Get user name from database.
        # TODO: Kinda expensive operation, but maybe optimized later
        # prep_for = user_token.email
        response = await supabase.table('users').select('*').eq('id', user_token.id).execute()
        if not response.data:
            logger.error(f"User not found for {user_token.id}")
            return
        user_row = response.data[0]
        prep_for = user_row['full_name']
        prep_by = 'InboxClarity'

        # Render the newsletter template
        newsletter_content = template.render(
            summary=summary_content,
            logo_data=os.getenv('LOGO_URL', ''),
            settings_url=os.getenv('APP_SETTINGS_URL', ''),
            # day_of_week=day_of_week,
            # date=date,
            # is_premium=is_premium,
            prep_for=prep_for,
            prep_by=prep_by,
            timestamp=timestamp
        )

        # # Save the newsletter to a file
        # Path('temp/newsletters').mkdir(parents=True, exist_ok=True)
        # Path(f"temp/newsletters/newsletter_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html").write_text(
        #     newsletter_content,
        #     encoding='utf-8')

        subject_line = await generate_subject_line(summary_content)

        return {
            "html_content": newsletter_content,
            "subject_line": subject_line
        }

        # return {
        #     'html_content': newsletter_result['html_content'],
        #     'subject_line': newsletter_result.get('subject_line'),
        #     'generated_at': datetime.now().isoformat(),
        #     'video_count': len(valid_videos),
        #     'videos': [{'id': v.video_id, 'title': v.title, 'url': v.url}
        #                for v, _ in valid_videos]
        # }

        # if summary_content:
        #     return {
        #         'html_content': summary_content,  # Assuming process_summary returns HTML content
        #         'subject_line': 'Your Daily News Summary',
        #         'generated_at': datetime.now().isoformat(),
        #         'prepared_for': user_token.email,
        #     }
        # else:
        #     # logger.error(f"Failed to generate summary for user {user_id}")
        #     logger.error(f"Failed to generate summary")
        #     return None

    except Exception as e:
        logger.error(f"Error generating newsletter content: {str(e)}")
        raise e


async def send_user_newsletter(user_token: UserToken, newsletter_data: Dict) -> bool:
    """Send a pre-generated newsletter to a user"""
    try:
        if not newsletter_data.get('content', {}).get('html_content'):
            logger.error(f"Invalid newsletter data for {user_token.email}")
            return False

        email_service = EmailService()

        # Use the generated subject line if available, otherwise fall back to default
        subject_line = (
                newsletter_data.get('content', {}).get('subject_line') or
                os.getenv('EMAIL_SUBJECT', 'Your Slack Newsletter')
        )

        success = await email_service.send_email(
            email_subject=subject_line,
            user_token=user_token,
            html_content=newsletter_data['content']['html_content']
        )

        logger.info(f"Newsletter sent to {user_token.email} with subject: {subject_line}")
        return success

    except Exception as e:
        logger.error(f"Error sending newsletter to {user_token.email}: {str(e)}")
        return False


async def process_user_newsletter(token: UserToken) -> Optional[Dict]:
    """Process and send newsletter for a single user"""
    logger.info(f"Starting newsletter processing for user {token.email}")

    try:
        content = await generate_newsletter_content(token)
        if not content:
            raise HTTPException(status_code=500, detail="Failed to generate newsletter content")

        queue_data = {
            'user_id': token.id,
            'email': token.email,
            'content': content,
            'scheduled_send_time': datetime.now(pytz.UTC).isoformat(),
            'status': 'generated',
            'attempt_count': 0,
        }

        # Store in database for tracking
        supabase = await get_supabase_client()
        queue_result = await supabase.table('inboxclarity_newsletter_queue').insert(queue_data).execute()
        newsletter_id = queue_result.data[0]['id']

        # Send immediately
        success = await send_user_newsletter(token, {'content': content})

        # Update queue status
        update_data = {
            'status': 'sent' if success else 'failed',
            'attempt_count': 1,
            'last_attempt_time': datetime.now(pytz.UTC).isoformat()
        }

        supabase = await get_supabase_client()
        await supabase.table('inboxclarity_newsletter_queue') \
            .update(update_data) \
            .eq('id', newsletter_id) \
            .execute()

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send newsletter")

        return {
            "success": True,
            "message": "Newsletter processed and sent successfully",
            "newsletter_id": newsletter_id,
            "stats": {
                # "video_count": content.get('video_count', 0),
                "generated_at": content.get('generated_at'),
                # "videos": content.get('videos', [])
            }
        }

    except Exception as e:
        logger.error(f"Error processing newsletter for {token.email}: {str(e)}")
        raise e


async def process_newsletter_task(email: str, prompt: str = None):
    """Background task that handles all database operations and newsletter processing"""
    try:
        # Database operations moved to background task
        supabase = await get_supabase_client()
        response = await supabase.table('user_google_tokens').select('*').eq('email', email).execute()

        if not response.data:
            logger.error(f"No token found for email: {email}")
            return

        token = UserToken(**response.data[0])

        if prompt:
            PromptOverride.set_prompt(prompt)

        try:
            # Directly await the async function
            result = await process_user_newsletter(token)
            logger.info(f"Newsletter processing completed for {email}: {result}")
        except Exception as e:
            raise e
        finally:
            if prompt:
                PromptOverride.set_prompt('')

    except Exception as e:
        logger.error(f"Error in background task for {email}: {str(e)}")
        raise e


async def generate_subject_line(summary: str) -> str:
    """
    Generate a clickbaity subject line for the newsletter based on summary.
    """
    prompt = SUBJECT_LINE_PROMPT.format(summary=summary)

    try:
        # Generate summary using your OpenAI client
        # response = await openai.generate_content(prompt=prompt)
        response = model.generate_content(prompt)
        response = response.text

        subject_line = response.strip()
        return subject_line
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
