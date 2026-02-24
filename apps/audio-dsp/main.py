# apps/audio-dsp/main.py
# DIETER PRO - Python Audio DSP Microservice
# FastAPI server that handles:
# - Stem splitting (Demucs)
# - Audio upmixing and enhancement
# - FX chain processing (reverb, delay, compression)
# - Upload/download from S3-compatible storage

import os
import tempfile
import boto3
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import logging

from routes.stems import router as stems_router
from routes.upmix import router as upmix_router
from routes.effects import router as effects_router

# ============================================================
# LOGGING
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================
# APP
# ============================================================
app = FastAPI(
    title='DIETER PRO - Audio DSP Service',
    description='Python microservice for stem splitting, FX processing, and audio enhancement',
    version='1.0.0',
    docs_url='/docs',
    redoc_url='/redoc'
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', os.getenv('NEXT_PUBLIC_APP_URL', '')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ============================================================
# S3 CLIENT
# ============================================================
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT'),
    aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY'),
    region_name=os.getenv('S3_REGION', 'auto')
)

# Make client available to routes
app.state.s3 = s3_client
app.state.s3_bucket = os.getenv('S3_BUCKET', 'dieter-media')

# ============================================================
# ROUTES
# ============================================================
app.include_router(stems_router, prefix='/stems', tags=['Stem Splitting'])
app.include_router(upmix_router, prefix='/upmix', tags=['Upmixing'])
app.include_router(effects_router, prefix='/effects', tags=['FX Chain'])

# ============================================================
# HEALTH CHECK
# ============================================================
@app.get('/health')
async def health():
    return {
        'status': 'ok',
        'service': 'audio-dsp',
        'version': '1.0.0',
        'gpu_available': _check_gpu()
    }

def _check_gpu() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False

# ============================================================
# STARTUP / SHUTDOWN
# ============================================================
@app.on_event('startup')
async def startup_event():
    logger.info('Audio DSP service starting...')
    gpu = _check_gpu()
    logger.info(f'GPU available: {gpu}')
    logger.info('Audio DSP service ready')

@app.on_event('shutdown')
async def shutdown_event():
    logger.info('Audio DSP service shutting down...')

# ============================================================
# ENTRY POINT
# ============================================================
if __name__ == '__main__':
    uvicorn.run(
        'main:app',
        host='0.0.0.0',
        port=int(os.getenv('PORT', 6000)),
        reload=os.getenv('NODE_ENV') != 'production',
        workers=1  # Keep 1 worker to share GPU memory
    )
