import os
import aiohttp
import asyncio

from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv()


class OpenAI:
    def __init__(self, api_key: str = os.getenv("OPENAI_KEY"),
                 api_url: str = "https://api.openai.com/v1/chat/completions"):
        self.api_url = api_url
        self.api_key = api_key

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def generate_content(self, prompt: str, model: str = "gpt-4o") -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(self.api_url, headers=headers, json=payload, timeout=30) as response:
                response.raise_for_status()
                data = await response.json()
                if 'choices' not in data or not data['choices']:
                    raise ValueError(f"API error: {data.get('error', {}).get('message', 'Unknown error')}")
                return data["choices"][0]["message"]["content"]


openai = OpenAI()
