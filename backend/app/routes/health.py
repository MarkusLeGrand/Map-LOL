"""
Health check endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from database import get_db

router = APIRouter()


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "online",
        "service": "OpenRift Analytics API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/health")
@router.head("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for monitoring services (UptimeRobot, etc.)

    Supports both GET and HEAD requests.
    Verifies database connectivity.
    """
    try:
        # Test database connection by running a simple query
        db.execute(text("SELECT 1")).fetchone()

        return {
            "status": "healthy",
            "service": "OpenRift Analytics API",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        # If DB fails, return 503 Service Unavailable
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "service": "OpenRift Analytics API",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )


@router.get("/api/health")
@router.head("/api/health")
async def api_health_check(db: Session = Depends(get_db)):
    """
    API health check endpoint for monitoring services

    Same as /health but under /api namespace for consistency
    Supports both GET and HEAD requests
    """
    try:
        # Test database connection
        db.execute(text("SELECT 1")).fetchone()

        return {
            "status": "healthy",
            "service": "OpenRift Analytics API",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "service": "OpenRift Analytics API",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )
