# scheduler.py

import logging
import pytz

from datetime import datetime, timedelta
from typing import Dict

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database.supabase_connection import get_supabase_client
from app.newsletter.newsletter import generate_newsletter_content, send_user_newsletter
from app.schemas import UserToken
logger = logging.getLogger(__name__)


class NewsletterScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.supabase = None
        self.setup_jobs()

    async def initialize(self):
        """Initialize the Supabase client"""
        self.supabase = await get_supabase_client()

    def setup_jobs(self):
        # Scheduler job: Runs every 5 minutes to queue newsletters
        self.scheduler.add_job(
            self.process_scheduling,
            CronTrigger(minute="*/5"),  # Runs every 5 minutes
            id="scheduler_job",
        )

        # Sender job: Runs every 1 minute to send emails from the queue
        self.scheduler.add_job(
            self.process_pending_newsletters,
            CronTrigger(minute="*"),  # Runs every 1 minute
            id="sender_job",
        )

    async def start(self):
        if not self.scheduler.running:
            await self.initialize()  # Initialize Supabase client
            self.scheduler.start()
            logger.info("Newsletter scheduler started")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Newsletter scheduler stopped")

    def calculate_utc_send_time(self, local_tz: str, preferred_hour: int) -> datetime:
        """Calculate the exact UTC time for the next newsletter delivery"""

        # Get current time in user's timezone
        user_tz = pytz.timezone(local_tz)
        current_time = datetime.now(user_tz)

        # Create target time for today at preferred hour
        target_time = current_time.replace(
            hour=preferred_hour,
            minute=0,
            second=0,
            microsecond=0,
        )

        # If the target time has passed for today, schedule for tomorrow
        if current_time > target_time:
            target_time = target_time + timedelta(days=1)

        # Convert to UTC
        return target_time.astimezone(pytz.UTC)

    async def process_scheduling(self):
        """Fetch user preferences and schedule newsletters in the queue"""
        try:
            # Lookahead window (e.g., next 10 minutes)
            lookahead_minutes = 58

            # Call the stored procedure to get users within the lookahead window
            response = await self.supabase.rpc(
                "inboxclarity_get_users_for_scheduling",
                {"lookahead_minutes": lookahead_minutes}
            ).execute()

            users = response.data
            if not users:
                logger.info("No users found for scheduling.")
                return

            # Schedule newsletters for the returned users
            for user in users:
                scheduled_send_time = self.calculate_utc_send_time(
                    user["timezone"],
                    user["preferred_hour"]
                )

                # Check if newsletter already exists for this user and time
                existing_newsletter = await self.supabase.table("inboxclarity_newsletter_queue") \
                    .select("*") \
                    .eq("user_id", user["user_id"]) \
                    .eq("scheduled_send_time", scheduled_send_time.isoformat()) \
                    .execute()

                if existing_newsletter.data:
                    logger.info(
                        f"Newsletter already scheduled for {user['email']} at {scheduled_send_time}"
                    )
                    continue

                # Generate content and queue
                content = await generate_newsletter_content(UserToken(
                    id=user["user_id"],
                    email=user["email"],
                    g_provider_token=user["g_provider_token"],
                    g_provider_refresh_token=user["g_provider_refresh_token"],
                    created_at=user["created_at"],
                    updated_at=user["updated_at"]
                ))

                queue_data = {
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "content": content,
                    "scheduled_send_time": scheduled_send_time.isoformat(),
                    "status": "generated",
                    "attempt_count": 0,
                }

                await self.supabase.table("inboxclarity_newsletter_queue").insert(queue_data).execute()
                logger.info(
                    f"Newsletter scheduled for {user['email']} at {scheduled_send_time}"
                )

        except Exception as e:
            logger.error(f"Error during scheduling: {str(e)}")

    async def process_pending_newsletters(self):
        """Fetch and process pending newsletters from the queue"""
        try:
            current_time = datetime.now(pytz.UTC)

            newsletters = await self.supabase.table("inboxclarity_newsletter_queue") \
                .select("*") \
                .eq("status", "generated") \
                .lt("attempt_count", 3) \
                .lte("scheduled_send_time", current_time.isoformat()) \
                .execute()

            if not newsletters.data:
                logger.info("No newsletters to process.")
                return

            for newsletter in newsletters.data:
                await self.process_queued_newsletter(newsletter)

        except Exception as e:
            logger.error(f"Error during sending newsletters: {str(e)}")

    async def process_queued_newsletter(self, newsletter: Dict):
        """Send a single queued newsletter"""
        try:
            await self.update_newsletter_status(newsletter["id"], "sending")

            token_response = await self.supabase.table("user_google_tokens") \
                .select("*") \
                .eq("email", newsletter["email"]) \
                .execute()

            if not token_response.data:
                await self.update_newsletter_status(
                    newsletter["id"],
                    "failed",
                    "User token not found"
                )
                return

            token = UserToken(**token_response.data[0])
            success = await send_user_newsletter(token, newsletter)

            if success:
                logger.info(f"Newsletter sent to {newsletter['email']}")

            # Update status
            status = "sent" if success else "failed"
            await self.update_newsletter_status(
                newsletter["id"],
                status,
                None if success else "Failed to send"
            )

        except Exception as e:
            await self.update_newsletter_status(
                newsletter["id"],
                "failed",
                str(e)
            )

    async def update_newsletter_status(self, newsletter_id: str, status: str, error_message: str = None):
        """Update newsletter status in queue"""
        try:
            # First get current attempt count
            response = await self.supabase.table("inboxclarity_newsletter_queue") \
                .select("attempt_count") \
                .eq("id", newsletter_id) \
                .execute()

            if not response.data:
                logger.error(f"Newsletter {newsletter_id} not found.")
                return

            current_attempts = response.data[0]["attempt_count"]

            # Prepare update data
            update_data = {
                "status": status,
                "last_attempt_time": datetime.now(pytz.UTC).isoformat(),
                "attempt_count": current_attempts + 1,
            }
            if error_message:
                update_data["error_message"] = error_message

            await self.supabase.table("inboxclarity_newsletter_queue") \
                .update(update_data) \
                .eq("id", newsletter_id) \
                .execute()

            logger.info(f"Updated newsletter {newsletter_id} status to {status}")

        except Exception as e:
            logger.error(f"Error updating newsletter {newsletter_id}: {str(e)}")

            await self.supabase.table("inboxclarity_newsletter_queue") \
                .update({
                    "status": "failed",
                    "error_message": str(e)
                }) \
                .eq("id", newsletter_id) \
                .execute()
