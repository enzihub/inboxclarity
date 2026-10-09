import base64
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import HTTPException

from app.ai.prompts import GMAIL_SUMMARY_PROMPT
from app.auth.credentials import get_valid_credentials
from app.schemas import UserToken
import google.generativeai as genai
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

model = genai.GenerativeModel("gemini-2.0-flash-exp")

load_dotenv()


async def get_gmail_service(user_token:UserToken):
    """Create Gmail API service instance using OAuth2 token."""
    try:
        token = await get_valid_credentials(user_token)
        creds = Credentials(
            token=token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
        )
        return build('gmail', 'v1', credentials=creds)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Failed to authenticate with Gmail")


async def get_unread_emails(service, limit=None):
    """Fetch unread emails from past 24 hours. If limit is specified, returns only that many."""
    try:
        # Calculate 24 hours ago in Unix timestamp
        one_day_ago = int((datetime.now() - timedelta(days=1)).timestamp())

        # Query params for unread messages from last 24 hours
        query_params = {
            'userId': 'me',
            'q': f'is:unread after:{one_day_ago}',
        }

        # Add maxResults only if limit is specified
        if limit is not None:
            query_params['maxResults'] = limit

        results = service.users().messages().list(**query_params).execute()

        messages = results.get('messages', [])
        if not messages:
            return []

        full_messages = []
        for message in messages:
            msg = service.users().messages().get(
                userId='me',
                id=message['id'],
                format='full'
            ).execute()

            # Extract relevant details
            headers = msg['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'No Subject')
            from_header = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'Unknown Sender')
            date = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')

            # Get message body
            body = ''
            if 'parts' in msg['payload']:
                for part in msg['payload']['parts']:
                    if part['mimeType'] == 'text/plain':
                        body = part['body'].get('data', '')
            elif 'body' in msg['payload']:
                body = msg['payload']['body'].get('data', '')

            full_messages.append({
                'id': message['id'],
                'subject': subject,
                'from': from_header,
                'date': date,
                'body': body
            })

        return full_messages

    except HttpError as error:
        raise HTTPException(status_code=500, detail=f"Gmail API error: {str(error)}")


async def preprocess_messages(messages, user_token=None):
    """Preprocess email messages for summary generation."""
    if not messages:
        return "No unread emails found."

    def decode_base64_content(encoded_content):
        """Decode base64 encoded content with padding fix."""
        try:
            padding = 4 - (len(encoded_content) % 4)
            if padding != 4:
                encoded_content += '=' * padding

            # Decode base64
            decoded_bytes = base64.urlsafe_b64decode(encoded_content)
            return decoded_bytes.decode('utf-8')
        except Exception as e:
            return f"Error decoding content: {str(e)}"

    processed_content = []
    for msg in messages:
        # Decode body if it's base64 encoded
        body = msg['body']
        if body:  # Only try to decode if body is not empty
            try:
                body = decode_base64_content(body)
            except:
                pass  # Keep original body if decoding fails

        processed_content.append(
            f"From: {msg['from']}\n"
            f"Subject: {msg['subject']}\n"
            f"Date: {msg['date']}\n"
            f"Content: {body}\n"
            "---"
        )

    return "\n".join(processed_content)


async def generate_gmail_summary(user_token: UserToken):
    try:
        # Initialize Gmail service with user's token
        service = await get_gmail_service(user_token)

        # Get unread messages (limited to 3 oldest)
        # all_messages = await get_unread_emails(service, limit=3)
        all_messages = await get_unread_emails(service)

        # Process messages
        processed_messages = await preprocess_messages(all_messages, user_token)

        prompt = GMAIL_SUMMARY_PROMPT.format(
            content=processed_messages,
            date=datetime.now(),
            user_name="InboxClarity"
        )

        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        cleaned_text = raw_text

        # Remove backticks and check for html tags
        if raw_text.startswith('```html'):
            cleaned_text = raw_text[7:-3].strip()  # Remove ```html and ending ```
        return cleaned_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))