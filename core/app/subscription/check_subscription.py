from app.database.supabase_connection import get_supabase_client, logger


# async def get_user_subscriptions(user_id: str) -> list:
async def get_user_subscriptions(user_email: str) -> list:
    """
    Get active subscriptions for a user related to a specific product.

    Args:
        user_id: str - The user's unique identifier

    Returns:
        list - List of subscription objects with their associated prices and products
    """
    try:
        supabase = await get_supabase_client()

        response = await supabase.table('subscriptions') \
            .select('*, prices(*, products(*))') \
            .eq('email', user_email) \
            .eq('metadata->>app_code', 'inboxclarity') \
            .in_('status', ['trialing', 'active']) \
            .execute()

        return response.data if response and response.data else []

    except Exception as e:
        logger.error(f"Error fetching subscriptions for user {user_email}: {str(e)}")
        # logger.error(f"Error fetching subscriptions for user {user_id}: {str(e)}")
        return []


# async def get_user_video_limit(user_id: str) -> int:
#     """
#     Get number of videos allowed from user's subscription price metadata.
#     Returns default limit of 3 for free accounts.
#     """
#     subscriptions = await get_user_subscriptions(user_id)
#
#     if not subscriptions:
#         logger.info(f"No subscription metadata for user {user_id}, using free tier")
#         return 3
#
#     # Handle multiple subscriptions - get the highest video limit
#     video_limits = []
#     for subscription in subscriptions:
#         if subscription.get('prices') and subscription['prices'].get('metadata'):
#             video_limit = subscription['prices']['metadata'].get('newsletter_videos', '3')
#             video_limits.append(int(video_limit))
#
#     # Return highest limit if any found, otherwise return default
#     if video_limits:
#         max_limit = max(video_limits)
#         logger.info(f"Found video limit {max_limit} for user {user_id}")
#         return max_limit
#
#     return 3
