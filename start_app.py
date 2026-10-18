#!/usr/bin/env python3
"""
Single-command launcher for Saathi Health Companion.
Starts the FastAPI backend and serves the production-built React frontend.
Supports PORT and HOST environment variables for Render and cloud deployments.
"""

import os
import sys
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print("==================================================================")
    print("  SAATHI HEALTH COMPANION - ASHA/ANM FRONTLINE ASSISTANT")
    print(f"  Starting server at: http://{host}:{port}")
    print(f"  API Docs available at: http://{host}:{port}/docs")
    print("==================================================================")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
