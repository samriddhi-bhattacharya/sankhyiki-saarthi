
import sqlite3
from pathlib import Path


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "sankhyiki.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():

    conn = get_db()
    cursor = conn.cursor()

    # ========================================================
    # USERS
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            birth_date TEXT,
            profession TEXT DEFAULT 'Student',
            college TEXT,
            learning_goal TEXT DEFAULT 'Skill Development',
            language TEXT DEFAULT 'English',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ========================================================
    # LEARNING PROGRESS
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id TEXT,
            course_name TEXT NOT NULL,
            provider TEXT,
            progress INTEGER DEFAULT 0,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ========================================================
    # COMPETENCIES
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS competencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            competency TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ========================================================
    # QUIZ ATTEMPTS
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject TEXT,
            score INTEGER DEFAULT 0,
            difficulty TEXT DEFAULT 'Medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ========================================================
    # NOTES
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ========================================================
    # BOONSCROLLING POSTS
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS boonscrolling_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            subject TEXT,
            category TEXT,
            content_type TEXT DEFAULT 'article',
            image_url TEXT,
            source TEXT,
            duration TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ========================================================
    # STUDY MATERIALS
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        subject TEXT,
        description TEXT,
        material_type TEXT DEFAULT 'PDF',
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ========================================================
    # BOONSCROLLING INTERACTIONS
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS boonscrolling_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            liked INTEGER DEFAULT 0,
            bookmarked INTEGER DEFAULT 0,
            share_count INTEGER DEFAULT 0,
            test_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (post_id) REFERENCES boonscrolling_posts(id)
        )
    """)

    # ========================================================
    # LEARNING PROGRESS MIGRATION
    # ========================================================

    cursor.execute("""
        PRAGMA table_info(learning_progress)
    """)

    columns = [
        row["name"]
        for row in cursor.fetchall()
    ]

    if "course_url" not in columns:

        cursor.execute("""
            ALTER TABLE learning_progress
            ADD COLUMN course_url TEXT
        """)

    # ========================================================
    # NOTES MIGRATIONS
    # ========================================================

    cursor.execute("""
        PRAGMA table_info(notes)
    """)

    note_columns = [
        row["name"]
        for row in cursor.fetchall()
    ]

    # Drawing data
    if "drawing_data" not in note_columns:

        cursor.execute("""
            ALTER TABLE notes
            ADD COLUMN drawing_data TEXT DEFAULT ''
        """)

    # Category / folder
    if "category" not in note_columns:

        cursor.execute("""
            ALTER TABLE notes
            ADD COLUMN category TEXT DEFAULT 'Uncategorized'
        """)

    # Note type
    if "note_type" not in note_columns:

        cursor.execute("""
            ALTER TABLE notes
            ADD COLUMN note_type TEXT DEFAULT 'written'
        """)

    # Uploaded file name
    if "file_name" not in note_columns:

        cursor.execute("""
            ALTER TABLE notes
            ADD COLUMN file_name TEXT DEFAULT ''
        """)

    # Uploaded file URL
    if "file_url" not in note_columns:

        cursor.execute("""
            ALTER TABLE notes
            ADD COLUMN file_url TEXT DEFAULT ''
        """)

    # ========================================================
    # SEMANTIC RAG - NOTE CHUNKS
    # ========================================================
    #
    # IMPORTANT:
    # This table MUST be outside the course_url migration.
    # Otherwise it would only be created when course_url
    # was missing.
    #

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS note_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            chunk_index INTEGER DEFAULT 0,
            content TEXT NOT NULL,
            embedding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (note_id) REFERENCES notes(id)
        )
    """)

    # ========================================================
    # COMMIT
    # ========================================================

    conn.commit()
    conn.close()


# ============================================================
# DIRECT EXECUTION
# ============================================================

if __name__ == "__main__":

    init_db()

    print("Database initialized successfully.")
