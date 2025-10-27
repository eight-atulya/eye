from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from api.routes import router as api_router
from api.metrics import router as metrics_router
from api.queue import router as queue_router
from api.jobs import router as jobs_router
from api.yolo_e import router as yolo_e_router
from api.annotations import router as annotations_router
from api.ollama import router as ollama_router
from api.memory import router as memory_router

print("DEBUG: Imported annotations router")

app = FastAPI(title="EYE API")

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Log the error but don't try to serialize binary data
    print(f"DEBUG: Validation error on {request.url}: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": str(exc)}
    )

# Configure CORS middleware for industrial-grade cross-origin support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3003",
        "http://localhost:3000",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3000",
        "http://frontend:3003",
        "http://frontend:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-EYE-Watermark",
        "Cache-Control",
        "Pragma"
    ],
    expose_headers=["X-EYE-Watermark"],
    max_age=3600
)

WATERMARK = "EYE for Humanity - I love machines, AI, humans, coffee, leaf. 8 is my north star. - (c) Anurag Atulya"

@app.middleware("http")
async def watermark_header(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-EYE-Watermark"] = WATERMARK.encode("ascii", "ignore").decode("ascii")
    return response

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(api_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(queue_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(yolo_e_router, prefix="/api")
app.include_router(annotations_router, prefix="/api")
app.include_router(ollama_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
