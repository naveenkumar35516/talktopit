from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from openai import OpenAI
from backend.config import OPENAI_API_KEY

router = APIRouter()

# Using Groq's free API (OpenAI-compatible) — no billing needed
client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


@router.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",   # change model name here anytime
            messages=[m.model_dump() for m in request.messages],
            temperature=0.7,
        )
        reply = response.choices[0].message.content
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.get("/api/generate-image")
async def generate_image(prompt: str = Query(...)):
    # Pollinations.ai — free, no API key needed
    encoded_prompt = prompt.replace(" ", "%20")
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
    return {"image_url": image_url}