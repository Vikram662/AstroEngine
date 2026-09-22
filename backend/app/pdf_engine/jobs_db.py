import os
import sqlite3
import datetime
from typing import Dict, Any, Optional, List

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage"))
DB_PATH = os.path.join(STORAGE_DIR, "pdf_jobs.db")

def init_db():
    os.makedirs(STORAGE_DIR, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pdf_jobs (
                job_id TEXT PRIMARY KEY,
                report_type TEXT NOT NULL,
                language TEXT DEFAULT 'en',
                status TEXT NOT NULL,
                file_url TEXT,
                file_path TEXT,
                credits_cost REAL DEFAULT 0.0,
                refunded INTEGER DEFAULT 0,
                failure_reason TEXT,
                owner_key_hash TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        # Migration for DBs created before owner_key_hash existed.
        try:
            cursor.execute("ALTER TABLE pdf_jobs ADD COLUMN owner_key_hash TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        conn.commit()

init_db()

class PersistentJobStore:
    """Thread-safe SQLite persistent store with dictionary-like fallback for compatibility."""
    
    def create_job(self, job_id: str, report_type: str, language: str = "en", credits_cost: float = 0.0) -> Dict[str, Any]:
        now = datetime.datetime.utcnow().isoformat()
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO pdf_jobs 
                (job_id, report_type, language, status, file_url, file_path, credits_cost, refunded, failure_reason, created_at, updated_at)
                VALUES (?, ?, ?, 'PENDING', NULL, NULL, ?, 0, NULL, ?, ?)
            """, (job_id, report_type, language, credits_cost, now, now))
            conn.commit()
        return self.get_job(job_id)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pdf_jobs WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["refunded"] = bool(data.get("refunded", 0))
            return data

    def update_status(
        self,
        job_id: str,
        status: str,
        file_url: Optional[str] = None,
        file_path: Optional[str] = None,
        failure_reason: Optional[str] = None,
        refunded: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        now = datetime.datetime.utcnow().isoformat()
        fields = ["status = ?", "updated_at = ?"]
        params = [status, now]

        if file_url is not None:
            fields.append("file_url = ?")
            params.append(file_url)
        if file_path is not None:
            fields.append("file_path = ?")
            params.append(file_path)
        if failure_reason is not None:
            fields.append("failure_reason = ?")
            params.append(failure_reason)
        if refunded is not None:
            fields.append("refunded = ?")
            params.append(1 if refunded else 0)

        params.append(job_id)
        sql = f"UPDATE pdf_jobs SET {', '.join(fields)} WHERE job_id = ?"
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
        return self.get_job(job_id)

    # Dictionary emulation for backward compatibility
    def __getitem__(self, job_id: str) -> Dict[str, Any]:
        job = self.get_job(job_id)
        if job is None:
            raise KeyError(job_id)
        return job

    def __setitem__(self, job_id: str, value: Dict[str, Any]):
        existing = self.get_job(job_id)
        if existing:
            self.update_status(
                job_id=job_id,
                status=value.get("status", existing["status"]),
                file_url=value.get("file_url", existing["file_url"]),
                file_path=value.get("file_path", existing.get("file_path")),
                failure_reason=value.get("failure_reason", existing.get("failure_reason")),
                refunded=value.get("refunded", existing.get("refunded"))
            )
        else:
            now = datetime.datetime.utcnow().isoformat()
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO pdf_jobs
                    (job_id, report_type, language, status, file_url, file_path, credits_cost, refunded, failure_reason, owner_key_hash, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    job_id,
                    value.get("report_type", "kundli_basic"),
                    value.get("language", "en"),
                    value.get("status", "PENDING"),
                    value.get("file_url"),
                    value.get("file_path"),
                    value.get("credits_cost", 0.0),
                    1 if value.get("refunded") else 0,
                    value.get("failure_reason"),
                    value.get("owner_key_hash"),
                    now,
                    now
                ))
                conn.commit()

    def get_all_jobs(self, limit: int = 100) -> List[Dict[str, Any]]:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pdf_jobs ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d["refunded"] = bool(d.get("refunded", 0))
                result.append(d)
            return result

    def get(self, job_id: str, default=None):
        job = self.get_job(job_id)
        return job if job is not None else default

    def __contains__(self, job_id: str) -> bool:
        return self.get_job(job_id) is not None

jobs_store = PersistentJobStore()
