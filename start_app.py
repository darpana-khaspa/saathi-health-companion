#!/usr/bin/env python3
"""
Single-command launcher for Saathi Health Companion.
Starts the FastAPI backend and serves the production-built React frontend.
Visit http://127.0.0.1:8000 in your browser.
"""

import sys
import uvicorn

if __name__ == "__main__":
    port = 8000
    host = "127.0.0.1"
    print("==================================================================")
    print("  SAATHI HEALTH COMPANION - ASHA/ANM FRONTLINE ASSISTANT")
    print(f"  Starting local offline server at: http://{host}:{port}")
    print("  API Docs available at            : http://127.0.0.1:8000/docs")
    print("==================================================================")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
