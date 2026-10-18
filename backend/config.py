"""
Configuration module for Saathi Health Companion backend.
Loads settings, paths, and thresholds with safe offline defaults.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Saathi Health Companion"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Data paths (checks root or data directory)
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "saathi_records.db")))
    
    PROTOCOL_CSV_PATH: Path = (
        DATA_DIR / "sample_protocol_knowledge_base.csv" 
        if (DATA_DIR / "sample_protocol_knowledge_base.csv").exists() 
        else BASE_DIR / "sample_protocol_knowledge_base.csv"
    )
    
    HOUSEHOLD_CSV_PATH: Path = (
        DATA_DIR / "sample_household_register.csv" 
        if (DATA_DIR / "sample_household_register.csv").exists() 
        else BASE_DIR / "sample_household_register.csv"
    )
    
    EVALUATION_CSV_PATH: Path = (
        DATA_DIR / "sample_evaluation_questions.csv" 
        if (DATA_DIR / "sample_evaluation_questions.csv").exists() 
        else BASE_DIR / "sample_evaluation_questions.csv"
    )
    
    # Offline retrieval parameters
    RETRIEVAL_SIMILARITY_THRESHOLD: float = 0.12  # Strict threshold for in-scope match
    HIGH_CONFIDENCE_THRESHOLD: float = 0.35
    MAX_RETRIEVAL_CHUNKS: int = 3
    
    # CORS origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

settings = Settings()
