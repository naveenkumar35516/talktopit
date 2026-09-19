from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers import chat

app = FastAPI(title="Talktopit")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)

app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")
app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def login_page():
    return FileResponse("frontend/login.html")


@app.get("/chat")
async def chat_page():
    return FileResponse("frontend/index.html")