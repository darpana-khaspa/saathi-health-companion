"""
Database module for Saathi Health Companion.
Uses SQLite for local, offline-first persistence of synthetic household register records.
Handles initial CSV seed import idempotently.
"""

import csv
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from backend.config import settings

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with dict-like row access, ensuring schema exists."""
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    # Ensure table exists
    conn.execute("""
    CREATE TABLE IF NOT EXISTS household_register (
        household_id TEXT PRIMARY KEY,
        beneficiary_name TEXT NOT NULL,
        beneficiary_age INTEGER,
        category TEXT NOT NULL,
        village TEXT NOT NULL,
        assigned_worker TEXT NOT NULL,
        next_visit_due TEXT NOT NULL,
        visit_status TEXT NOT NULL DEFAULT 'pending',
        risk_flag TEXT DEFAULT 'Normal',
        concise_visit_note TEXT,
        last_visit_date TEXT,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS cnt FROM household_register;")
    if cursor.fetchone()["cnt"] == 0:
        seed_from_csv(conn)
    return conn

def init_db() -> None:
    """Creates schema and seeds initial synthetic household register if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS household_register (
        household_id TEXT PRIMARY KEY,
        beneficiary_name TEXT NOT NULL,
        beneficiary_age INTEGER,
        category TEXT NOT NULL,
        village TEXT NOT NULL,
        assigned_worker TEXT NOT NULL,
        next_visit_due TEXT NOT NULL,
        visit_status TEXT NOT NULL DEFAULT 'pending',
        risk_flag TEXT DEFAULT 'Normal',
        concise_visit_note TEXT,
        last_visit_date TEXT,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Check if table has records; if not, seed from CSV
    cursor.execute("SELECT COUNT(*) AS cnt FROM household_register;")
    count = cursor.fetchone()["cnt"]

    if count == 0:
        seed_from_csv(conn)

    conn.close()

def seed_from_csv(conn: sqlite3.Connection, csv_path: Optional[Path] = None) -> int:
    """Seeds records from synthetic household CSV safely with INSERT OR IGNORE."""
    path = csv_path or settings.HOUSEHOLD_CSV_PATH
    if not path.exists():
        alt_path = settings.DATA_DIR / "sample_household_register.csv"
        if alt_path.exists():
            path = alt_path
        else:
            return 0

    inserted = 0
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cursor = conn.cursor()
        for row in reader:
            cursor.execute("""
                INSERT OR IGNORE INTO household_register (
                    household_id, beneficiary_name, beneficiary_age, category,
                    village, assigned_worker, next_visit_due, visit_status,
                    risk_flag, concise_visit_note, last_visit_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row.get("household_id", "").strip(),
                row.get("beneficiary_name", "").strip(),
                int(row.get("beneficiary_age", 25) or 25),
                row.get("category", "").strip(),
                row.get("village", "").strip(),
                row.get("assigned_worker", "").strip(),
                row.get("next_visit_due", "").strip(),
                row.get("visit_status", "pending").strip().lower(),
                row.get("risk_flag", "Normal").strip(),
                row.get("concise_visit_note", "").strip(),
                row.get("last_visit_date", "").strip()
            ))
            inserted += cursor.rowcount
        conn.commit()

    return inserted
