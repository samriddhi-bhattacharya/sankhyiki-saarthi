from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory
)
from flask_cors import CORS
from dotenv import load_dotenv
from database import get_db, init_db
from datetime import datetime
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader

import os
import json
import urllib.request
import urllib.error
import time
import uuid
import math

# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

app = Flask(__name__)
CORS(app)

# Maximum upload size = 15 MB
app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024

# Make sure database/tables exist
init_db()


# ============================================================
# UPLOAD CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads",
    "notes"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    "pdf"
}


def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(
            ".",
            1
        )[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ============================================================
# DATABASE MIGRATIONS
# ============================================================

def ensure_course_url_column():

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "PRAGMA table_info(learning_progress)"
        )

        columns = [
            row["name"]
            for row in cursor.fetchall()
        ]

        if "course_url" not in columns:

            cursor.execute(
                """
                ALTER TABLE learning_progress
                ADD COLUMN course_url TEXT DEFAULT ''
                """
            )

            conn.commit()

            print(
                "course_url column added to learning_progress"
            )

    except Exception as e:

        print(
            "Course URL migration error:",
            e
        )

    finally:

        conn.close()


def ensure_notes_drawing_column():

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "PRAGMA table_info(notes)"
        )

        columns = [
            row["name"]
            for row in cursor.fetchall()
        ]

        if "drawing_data" not in columns:

            cursor.execute(
                """
                ALTER TABLE notes
                ADD COLUMN drawing_data TEXT DEFAULT ''
                """
            )

            conn.commit()

            print(
                "drawing_data column added to notes"
            )

    except Exception as e:

        print(
            "Notes drawing migration error:",
            e
        )

    finally:

        conn.close()


def ensure_notes_organization_columns():

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "PRAGMA table_info(notes)"
        )

        columns = [
            row["name"]
            for row in cursor.fetchall()
        ]

        # ----------------------------------------------------
        # CATEGORY / FOLDER
        # ----------------------------------------------------

        if "category" not in columns:

            cursor.execute(
                """
                ALTER TABLE notes
                ADD COLUMN category TEXT
                DEFAULT 'Uncategorized'
                """
            )

            print(
                "category column added to notes"
            )

        # ----------------------------------------------------
        # NOTE TYPE
        # ----------------------------------------------------

        if "note_type" not in columns:

            cursor.execute(
                """
                ALTER TABLE notes
                ADD COLUMN note_type TEXT
                DEFAULT 'written'
                """
            )

            print(
                "note_type column added to notes"
            )

        # ----------------------------------------------------
        # ORIGINAL FILE NAME
        # ----------------------------------------------------

        if "file_name" not in columns:

            cursor.execute(
                """
                ALTER TABLE notes
                ADD COLUMN file_name TEXT
                DEFAULT ''
                """
            )

            print(
                "file_name column added to notes"
            )

        # ----------------------------------------------------
        # FILE URL
        # ----------------------------------------------------

        if "file_url" not in columns:

            cursor.execute(
                """
                ALTER TABLE notes
                ADD COLUMN file_url TEXT
                DEFAULT ''
                """
            )

            print(
                "file_url column added to notes"
            )

        conn.commit()

    except Exception as e:

        print(
            "Notes organization migration error:",
            e
        )

    finally:

        conn.close()


ensure_course_url_column()
ensure_notes_drawing_column()
ensure_notes_organization_columns()


# ============================================================
# GEMINI HELPER
# ============================================================

def call_gemini(
    prompt,
    temperature=0.7,
    model=None
):

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:

        raise Exception(
            "GEMINI_API_KEY is missing in .env"
        )

    if model:

        models = [
            model
        ]

    else:

        models = [
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-2.5-flash"
        ]

    last_error = None

    for model in models:

        url = (
            "https://generativelanguage.googleapis.com/"
            f"v1beta/models/{model}:generateContent"
            f"?key={api_key}"
        )

        payload = {

            "contents": [

                {
                    "parts": [

                        {
                            "text": prompt
                        }

                    ]
                }

            ],

            "generationConfig": {

                "temperature":
                temperature

            }

        }

        data = json.dumps(
            payload
        ).encode(
            "utf-8"
        )

        req = urllib.request.Request(

            url,

            data=data,

            headers={
                "Content-Type":
                "application/json"
            },

            method="POST"

        )

        for attempt in range(3):

            try:

                with urllib.request.urlopen(
                    req,
                    timeout=60
                ) as response:

                    raw = (
                        response
                        .read()
                        .decode("utf-8")
                    )

                    result = json.loads(
                        raw
                    )

                    candidates = result.get(
                        "candidates",
                        []
                    )

                    if not candidates:

                        raise Exception(
                            "Gemini returned no candidates"
                        )

                    parts = (
                        candidates[0]
                        .get("content", {})
                        .get("parts", [])
                    )

                    text_parts = []

                    for part in parts:

                        if "text" in part:

                            text_parts.append(
                                part["text"]
                            )

                    final_text = "\n".join(
                        text_parts
                    ).strip()

                    if not final_text:

                        raise Exception(
                            "Gemini returned empty response"
                        )

                    return final_text

            except urllib.error.HTTPError as e:

                error_body = ""

                try:

                    error_body = (
                        e.read()
                        .decode("utf-8")
                    )

                except Exception:

                    pass

                last_error = (
                    f"Gemini API error {e.code}: "
                    f"{error_body}"
                )

                if e.code == 429:

                    raise Exception(
                        "Gemini quota limit reached. "
                        "You have used the available Gemini API requests "
                        "for now. Please wait and try again later, or "
                        "check your Gemini API plan and billing details."
                    )

                if e.code in [
                    500,
                    502,
                    503,
                    504
                ]:

                    time.sleep(
                        2 * (attempt + 1)
                    )

                    continue

                if e.code == 404:

                    break

                raise Exception(
                    last_error
                )

            except Exception as e:

                last_error = str(e)

                if attempt < 2:

                    time.sleep(
                        2 * (attempt + 1)
                    )

                    continue

                break

    raise Exception(
        last_error
        or
        "Gemini request failed"
    )


# ============================================================
# BASIC HEALTH CHECK
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({

        "success": True,

        "message":
        "Sankhyiki Saarthi backend is running"

    })


# ============================================================
# REGISTER
# ============================================================

@app.route(
    "/api/register",
    methods=["POST"]
)
def register():

    data = request.get_json() or {}

    name = data.get(
        "name",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip()

    password = data.get(
        "password",
        ""
    ).strip()

    if not name or not email or not password:

        return jsonify({

            "success": False,

            "message":
            "All fields are required"

        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = ?
            """,
            (email,)
        )

        existing = cursor.fetchone()

        if existing:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "Email already registered"

            }), 409

        cursor.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password
            )
            VALUES (?, ?, ?)
            """,
            (
                name,
                email,
                password
            )
        )

        user_id = cursor.lastrowid

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Registration successful",

            "user_id":
            user_id

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/api/login",
    methods=["POST"]
)
def login():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip()

    password = data.get(
        "password",
        ""
    ).strip()

    if not email or not password:

        return jsonify({

            "success": False,

            "message":
            "Email and password are required"

        }), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE email = ?
        AND password = ?
        """,
        (
            email,
            password
        )
    )

    user = cursor.fetchone()

    conn.close()

    if not user:

        return jsonify({

            "success": False,

            "message":
            "Invalid email or password"

        }), 401

    return jsonify({

        "success": True,

        "message":
        "Login successful",

        "user":
        dict(user)

    })


# ============================================================
# PROFILE - GET
# ============================================================

@app.route(
    "/api/profile/<int:user_id>",
    methods=["GET"]
)
def get_profile(user_id):

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    )

    user = cursor.fetchone()

    conn.close()

    if not user:

        return jsonify({

            "success": False,

            "message":
            "User not found"

        }), 404

    return jsonify({

        "success": True,

        "user":
        dict(user)

    })


# ============================================================
# PROFILE - UPDATE
# ============================================================

@app.route(
    "/api/profile/<int:user_id>",
    methods=["PUT"]
)
def update_profile(user_id):

    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    birth_date = data.get("birth_date")
    profession = data.get("profession")
    college = data.get("college")
    learning_goal = data.get("learning_goal")
    language = data.get("language")

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "User not found"

            }), 404

        new_name = (
            name
            if name is not None
            else user["name"]
        )

        new_email = (
            email
            if email is not None
            else user["email"]
        )

        new_birth_date = (
            birth_date
            if birth_date is not None
            else user["birth_date"]
        )

        new_profession = (
            profession
            if profession is not None
            else user["profession"]
        )

        new_college = (
            college
            if college is not None
            else user["college"]
        )

        new_learning_goal = (
            learning_goal
            if learning_goal is not None
            else user["learning_goal"]
        )

        new_language = (
            language
            if language is not None
            else user["language"]
        )

        cursor.execute(
            """
            UPDATE users
            SET
                name = ?,
                email = ?,
                birth_date = ?,
                profession = ?,
                college = ?,
                learning_goal = ?,
                language = ?
            WHERE id = ?
            """,
            (
                new_name,
                new_email,
                new_birth_date,
                new_profession,
                new_college,
                new_learning_goal,
                new_language,
                user_id
            )
        )

        conn.commit()

        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        )

        updated_user = cursor.fetchone()

        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Profile updated successfully",

            "user":
            dict(updated_user)

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500
# ============================================================
# DASHBOARD
# ============================================================

@app.route(
    "/api/dashboard/<int:user_id>",
    methods=["GET"]
)
def dashboard(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        # ============================================================
        # USER
        # ============================================================

        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404


        # ============================================================
        # LEARNING PROGRESS
        # ============================================================

        cursor.execute(
            """
            SELECT *
            FROM learning_progress
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        progress_rows = cursor.fetchall()

        progress_list = [
            dict(row)
            for row in progress_rows
        ]


        # ============================================================
        # COMPETENCIES
        # ============================================================

        cursor.execute(
            """
            SELECT *
            FROM competencies
            WHERE user_id = ?
            ORDER BY id
            """,
            (user_id,)
        )

        competency_rows = cursor.fetchall()

        competencies = [
            dict(row)
            for row in competency_rows
        ]


        # ============================================================
        # QUIZ ATTEMPTS
        # ============================================================

        cursor.execute(
            """
            SELECT *
            FROM quiz_attempts
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        quiz_rows = cursor.fetchall()

        quiz_attempts = [
            dict(row)
            for row in quiz_rows
        ]


        # ============================================================
        # COURSE STATS
        # ============================================================

        total_courses = len(progress_list)

        completed_courses = 0

        for item in progress_list:

            progress_value = (
                item.get("progress", 0)
                or 0
            )

            try:
                progress_value = float(progress_value)
            except:
                progress_value = 0

            if progress_value >= 100:
                completed_courses += 1


        # ============================================================
        # COMPETENCY AVERAGE
        # ============================================================

        if competencies:

            competency_scores = []

            for row in competencies:

                score = row.get("score", 0) or 0

                try:
                    score = float(score)
                except:
                    score = 0

                competency_scores.append(score)

            if competency_scores:

                competency_avg = round(
                    sum(competency_scores)
                    /
                    len(competency_scores)
                )

            else:
                competency_avg = 0

        else:

            competency_avg = 0


        # ============================================================
        # QUIZ ACCURACY
        # ============================================================

        if quiz_attempts:

            quiz_scores = []

            for row in quiz_attempts:

                score = row.get("score", 0) or 0

                try:
                    score = float(score)
                except:
                    score = 0

                quiz_scores.append(score)

            if quiz_scores:

                quiz_accuracy = round(
                    sum(quiz_scores)
                    /
                    len(quiz_scores)
                )

            else:
                quiz_accuracy = 0

        else:

            quiz_accuracy = 0


        # ============================================================
        # LEARNING PULSE
        # ============================================================
        #
        # If the user has learning progress, calculate pulse
        # from actual course progress.
        #
        # If there is no learning activity, pulse = 0.
        #

        if progress_list:

            progress_values = []

            for item in progress_list:

                value = item.get(
                    "progress",
                    0
                ) or 0

                try:
                    value = float(value)
                except:
                    value = 0

                progress_values.append(value)

            if progress_values:

                learning_pulse = round(
                    sum(progress_values)
                    /
                    len(progress_values)
                )

            else:

                learning_pulse = 0

        else:

            learning_pulse = 0


        # ============================================================
        # STUDY TIME
        # ============================================================
        #
        # Calculate from learning_progress if a study-time column
        # exists.
        #

        study_minutes = 0

        try:

            cursor.execute(
                """
                PRAGMA table_info(learning_progress)
                """
            )

            columns = [
                row["name"]
                for row in cursor.fetchall()
            ]

            possible_time_columns = [
                "study_minutes",
                "minutes",
                "duration_minutes",
                "time_spent"
            ]

            time_column = None

            for column in possible_time_columns:

                if column in columns:
                    time_column = column
                    break

            if time_column:

                cursor.execute(
                    f"""
                    SELECT
                        COALESCE(
                            SUM({time_column}),
                            0
                        ) AS total_minutes
                    FROM learning_progress
                    WHERE user_id = ?
                    """,
                    (user_id,)
                )

                result = cursor.fetchone()

                if result:

                    study_minutes = (
                        result["total_minutes"]
                        or 0
                    )

        except Exception:

            study_minutes = 0


        try:

            study_minutes = int(
                float(study_minutes)
            )

        except:

            study_minutes = 0


        # ============================================================
        # STUDY SESSIONS
        # ============================================================
        #
        # One session is counted for each learning-progress record.
        #

        study_sessions = len(progress_list)


        # ============================================================
        # LEARNING RHYTHM
        # ============================================================
        #
        # Number of different days on which the user has activity.
        #

        learning_rhythm = 0

        if progress_list:

            activity_dates = set()

            for item in progress_list:

                created_at = (
                    item.get("created_at")
                    or item.get("updated_at")
                    or ""
                )

                if created_at:

                    activity_dates.add(
                        str(created_at)[:10]
                    )

            learning_rhythm = len(
                activity_dates
            )


        # ============================================================
        # WEEKLY CHANGE / MOMENTUM
        # ============================================================

        weekly_change = 0

        if progress_list or quiz_attempts:

            weekly_change = 12


        # ============================================================
        # FORMAT STUDY TIME
        # ============================================================

        hours = study_minutes // 60
        minutes = study_minutes % 60

        study_time = f"{hours}h {minutes}m"


        # ============================================================
        # FINAL STATS
        # ============================================================

        stats = {

            "learning_pulse":
            learning_pulse,

            "competency":
            competency_avg,

            "total_courses":
            total_courses,

            "completed_courses":
            completed_courses,

            "quiz_accuracy":
            quiz_accuracy,

            "study_time":
            study_time,

            "study_minutes":
            study_minutes,

            "sessions":
            study_sessions,

            "study_sessions":
            study_sessions,

            "learning_rhythm":
            learning_rhythm,

            "weekly_change":
            weekly_change

        }


        return jsonify({

            "success": True,

            "user":
            dict(user),

            "stats":
            stats,

            "courses":
            progress_list,

            "progress":
            (
                progress_list[0]
                if progress_list
                else None
            ),

            "progress_list":
            progress_list,

            "competencies":
            competencies,

            "quiz_attempts":
            quiz_attempts

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500

    finally:

        conn.close()
# ============================================================
# GREETING
# ============================================================

@app.route(
    "/api/greeting",
    methods=["GET"]
)
def greeting():

    hour = datetime.now().hour

    if hour < 12:

        message = "Good morning"

    elif hour < 17:

        message = "Good afternoon"

    else:

        message = "Good evening"

    return jsonify({

        "success": True,

        "greeting":
        message

    })


# ============================================================
# BOONSCROLLING - GENERATE
# ============================================================

@app.route(
    "/api/boonscrolling/generate",
    methods=["POST"]
)
def generate_boonscrolling():

    data = request.get_json() or {}

    user_id = data.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "user_id is required"
        }), 400

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid user_id"
        }), 400

    count = int(
        data.get(
            "count",
            5
        )
    )

    prompt = f"""
You are the AI content engine for Sankhyiki Saarthi,
a learning platform for students and government learners.

Create exactly {count} educational Boonscrolling posts.

The content should feel like an Instagram/Facebook feed,
but every post must teach something useful.

Topics can include:
- Statistics
- Data Analysis
- Data Visualization
- Excel
- Research
- Government data
- Decision making
- General quantitative reasoning

Return ONLY valid JSON.

Format:

[
  {{
    "title": "Short engaging title",
    "description": "2-3 sentence explanation",
    "fact": "One useful fact or takeaway",
    "topic": "Statistics",
    "category": "Concept",
    "type": "post",
    "difficulty": "Beginner",
    "duration": "2 min"
  }}
]

Do not use markdown.
Do not add anything outside the JSON.
"""

    try:

        response = call_gemini(
            prompt,
            temperature=0.8
        )

        cleaned = response.strip()

        if cleaned.startswith("```"):

            cleaned = (
                cleaned
                .replace(
                    "```json",
                    ""
                )
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

        posts = json.loads(
            cleaned
        )

        conn = get_db()
        cursor = conn.cursor()

        saved_posts = []

        for post in posts:

            title = post.get(
                "title",
                "Learning Bite"
            )

            description = post.get(
                "description",
                ""
            )

            fact = post.get(
                "fact",
                ""
            )

            topic = post.get(
                "topic",
                "General"
            )

            category = post.get(
                "category",
                "Concept"
            )

            post_type = post.get(
                "type",
                "post"
            )

            difficulty = post.get(
                "difficulty",
                "Beginner"
            )

            duration = post.get(
                "duration",
                "2 min"
            )

            source = (
                "Sankhyiki Saarthi AI"
                f"|{difficulty}|{fact}"
            )

            cursor.execute(
                """
                INSERT INTO boonscrolling_posts
                (
                    title,
                    description,
                    fact,
                    topic,
                    category,
                    type,
                    difficulty,
                    duration,
                    source,
                    user_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    title,
                    description,
                    fact,
                    topic,
                    category,
                    post_type,
                    difficulty,
                    duration,
                    source,
                    user_id
                )
            )

            post_id = cursor.lastrowid

            saved_posts.append({

                "id":
                post_id,

                "title":
                title,

                "description":
                description,

                "fact":
                fact,

                "topic":
                topic,

                "category":
                category,

                "type":
                post_type,

                "difficulty":
                difficulty,

                "duration":
                duration,

                "source":
                source,

                "user_id":
                user_id

            })

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "posts":
            saved_posts

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500
# ============================================================
# BOONSCROLLING - GET
# ============================================================

@app.route(
    "/api/boonscrolling",
    methods=["GET"]
)
def get_boonscrolling():

    # ------------------------------------------------------------
    # GET LOGGED-IN USER
    # ------------------------------------------------------------

    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "user_id is required"
        }), 400

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Invalid user_id"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        # --------------------------------------------------------
        # 1. GET ONLY THIS USER'S POSTS
        # --------------------------------------------------------

        cursor.execute(
            """
            SELECT *
            FROM boonscrolling_posts
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 5
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        # --------------------------------------------------------
        # 2. IF USER HAS NO POSTS, GENERATE 5 FOR THIS USER
        # --------------------------------------------------------

        if not rows:

            conn.close()

            try:

                prompt = """
Create exactly 5 educational Boonscrolling posts
for Sankhyiki Saarthi.

Return ONLY valid JSON in this format:

[
 {
   "title": "...",
   "description": "...",
   "fact": "...",
   "topic": "...",
   "category": "...",
   "type": "post",
   "difficulty": "Beginner",
   "duration": "2 min"
 }
]

No markdown.
"""

                response = call_gemini(
                    prompt,
                    temperature=0.8
                )

                cleaned = response.strip()

                if cleaned.startswith("```"):

                    cleaned = (
                        cleaned
                        .replace(
                            "```json",
                            ""
                        )
                        .replace(
                            "```",
                            ""
                        )
                        .strip()
                    )

                posts = json.loads(cleaned)

                conn = get_db()
                cursor = conn.cursor()

                # ------------------------------------------------
                # SAVE POSTS FOR THIS USER
                # ------------------------------------------------

                for post in posts:

                    difficulty = post.get(
                        "difficulty",
                        "Beginner"
                    )

                    fact = post.get(
                        "fact",
                        ""
                    )

                    source = (
                        "Sankhyiki Saarthi AI"
                        f"|{difficulty}|{fact}"
                    )

                    cursor.execute(
                        """
                        INSERT INTO boonscrolling_posts
                        (
                            user_id,
                            title,
                            description,
                            fact,
                            topic,
                            category,
                            type,
                            difficulty,
                            duration,
                            source
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            user_id,

                            post.get(
                                "title",
                                "Learning Bite"
                            ),

                            post.get(
                                "description",
                                ""
                            ),

                            fact,

                            post.get(
                                "topic",
                                "General"
                            ),

                            post.get(
                                "category",
                                "Concept"
                            ),

                            post.get(
                                "type",
                                "post"
                            ),

                            difficulty,

                            post.get(
                                "duration",
                                "2 min"
                            ),

                            source
                        )
                    )

                conn.commit()
                conn.close()

            except Exception as e:

                return jsonify({

                    "success": False,

                    "message":
                    str(e)

                }), 500

            # ----------------------------------------------------
            # FETCH AGAIN — NOW WITH USER FILTER
            # ----------------------------------------------------

            conn = get_db()
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT *
                FROM boonscrolling_posts
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT 5
                """,
                (user_id,)
            )

            rows = cursor.fetchall()

            conn.close()

        # --------------------------------------------------------
        # 3. RETURN ONLY THIS USER'S POSTS
        # --------------------------------------------------------

        posts = [
            dict(row)
            for row in rows
        ]

        return jsonify({

            "success": True,

            "posts":
            posts

        })

    except Exception as e:

        try:
            conn.close()
        except:
            pass

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500

# ============================================================
# BOONSCROLLING - INTERACTION HISTORY
# ============================================================

@app.route(
    "/api/boonscrolling/interactions/<int:user_id>",
    methods=["GET"]
)
def get_boonscrolling_interactions(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM boonscrolling_interactions
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        conn.close()

        return jsonify({

            "success": True,

            "interactions": [
                dict(row)
                for row in rows
            ]

        })

    except Exception as e:

        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# BOONSCROLLING - SAVE INTERACTION
# ============================================================

@app.route(
    "/api/boonscrolling/interact",
    methods=["POST"]
)
def save_boonscrolling_interaction():

    data = request.get_json() or {}

    user_id = data.get(
        "user_id"
    )

    post_id = data.get(
        "post_id"
    )

    # Frontend sends "action".
    # "interaction" remains supported for compatibility.
    action = (
        data.get("action")
        or data.get("interaction")
        or "view"
    )

    action = str(
        action
    ).strip().lower()

    if not user_id or not post_id:

        return jsonify({

            "success": False,

            "message":
            "user_id and post_id are required"

        }), 400

    # ========================================================
    # LIKE / BOOKMARK / SAVE
    # These interactions work as toggles.
    # ========================================================

    if action in [
        "like",
        "bookmark",
        "save"
    ]:

        # "save" and "bookmark" are treated the same.
        if action == "save":

            action = "bookmark"

        conn = get_db()
        cursor = conn.cursor()

        try:

            # ------------------------------------------------
            # CHECK CURRENT STATE
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT id
                FROM boonscrolling_interactions
                WHERE user_id = ?
                AND post_id = ?
                AND interaction = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (
                    user_id,
                    post_id,
                    action
                )
            )

            existing = cursor.fetchone()

            # ------------------------------------------------
            # TOGGLE OFF
            # ------------------------------------------------

            if existing:

                cursor.execute(
                    """
                    DELETE FROM boonscrolling_interactions
                    WHERE user_id = ?
                    AND post_id = ?
                    AND interaction = ?
                    """,
                    (
                        user_id,
                        post_id,
                        action
                    )
                )

                current_state = False

            # ------------------------------------------------
            # TOGGLE ON
            # ------------------------------------------------

            else:

                cursor.execute(
                    """
                    INSERT INTO boonscrolling_interactions
                    (
                        user_id,
                        post_id,
                        interaction
                    )
                    VALUES (?, ?, ?)
                    """,
                    (
                        user_id,
                        post_id,
                        action
                    )
                )

                current_state = True

            conn.commit()

            # ------------------------------------------------
            # GET FINAL STATE
            # ------------------------------------------------

            cursor.execute(
                """
                SELECT interaction
                FROM boonscrolling_interactions
                WHERE user_id = ?
                AND post_id = ?
                """,
                (
                    user_id,
                    post_id
                )
            )

            rows = cursor.fetchall()

            liked = False
            bookmarked = False

            for row in rows:

                interaction_name = (
                    row["interaction"]
                    or ""
                ).strip().lower()

                if interaction_name == "like":

                    liked = True

                elif interaction_name in [
                    "bookmark",
                    "save"
                ]:

                    bookmarked = True

            conn.close()

            return jsonify({

                "success": True,

                "message":
                "Interaction updated",

                "interaction": {

                    "user_id":
                    user_id,

                    "post_id":
                    post_id,

                    "action":
                    action,

                    "active":
                    current_state,

                    "liked":
                    liked,

                    "bookmarked":
                    bookmarked

                }

            })

        except Exception as e:

            conn.rollback()
            conn.close()

            return jsonify({

                "success": False,

                "message":
                str(e)

            }), 500

    # ========================================================
    # VIEW
    # View is not a toggle.
    # ========================================================

    if action == "view":

        conn = get_db()
        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO boonscrolling_interactions
                (
                    user_id,
                    post_id,
                    interaction
                )
                VALUES (?, ?, ?)
                """,
                (
                    user_id,
                    post_id,
                    "view"
                )
            )

            conn.commit()
            conn.close()

            return jsonify({

                "success": True,

                "message":
                "View interaction saved",

                "interaction": {

                    "user_id":
                    user_id,

                    "post_id":
                    post_id,

                    "action":
                    "view",

                    "active":
                    True,

                    "liked":
                    False,

                    "bookmarked":
                    False

                }

            })

        except Exception as e:

            conn.rollback()
            conn.close()

            return jsonify({

                "success": False,

                "message":
                str(e)

            }), 500

    # ========================================================
    # INVALID INTERACTION
    # ========================================================

    return jsonify({

        "success": False,

        "message":
        "Invalid interaction type"

    }), 400


# ============================================================
# LEARNING PROGRESS - GET
# ============================================================

@app.route(
    "/api/learning-progress/<int:user_id>",
    methods=["GET"]
)
def get_learning_progress(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM learning_progress
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        conn.close()

        result = []

        for row in rows:

            item = dict(row)

            if "course_url" in item:

                item["courseUrl"] = (
                    item["course_url"]
                    or ""
                )

            result.append(
                item
            )

        return jsonify({

            "success": True,

            "progress":
            result

        })

    except Exception as e:

        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# LEARNING PROGRESS - UPDATE
# ============================================================

@app.route(
    "/api/learning-progress/<int:progress_id>",
    methods=["PUT"]
)
def update_learning_progress(progress_id):

    data = request.get_json() or {}

    progress = data.get(
        "progress"
    )

    status = data.get(
        "status"
    )

    course_url = data.get(
        "course_url"
    )

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM learning_progress
            WHERE id = ?
            """,
            (progress_id,)
        )

        row = cursor.fetchone()

        if not row:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "Progress record not found"

            }), 404

        current_progress = (
            row["progress"]
            if "progress"
            in row.keys()
            else 0
        )

        current_status = (
            row["status"]
            if "status"
            in row.keys()
            else ""
        )

        current_url = (
            row["course_url"]
            if "course_url"
            in row.keys()
            else ""
        )

        new_progress = (
            progress
            if progress is not None
            else current_progress
        )

        new_status = (
            status
            if status is not None
            else current_status
        )

        new_url = (
            course_url
            if course_url is not None
            else current_url
        )

        cursor.execute(
            """
            UPDATE learning_progress
            SET
                progress = ?,
                status = ?,
                course_url = ?
            WHERE id = ?
            """,
            (
                new_progress,
                new_status,
                new_url,
                progress_id
            )
        )

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Learning progress updated"

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES DESK - GET NOTES
# ============================================================

@app.route(
    "/api/notes/<int:user_id>",
    methods=["GET"]
)
def get_notes(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                title,
                content,
                drawing_data,
                created_at,
                category,
                note_type,
                file_name,
                file_url
            FROM notes
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        conn.close()

        notes = []

        for row in rows:

            notes.append({

                "id":
                row["id"],

                "user_id":
                row["user_id"],

                "title":
                row["title"],

                "content":
                row["content"] or "",

                "drawing_data":
                row["drawing_data"] or "",

                "created_at":
                row["created_at"],

                "category":
                row["category"]
                or "Uncategorized",

                "note_type":
                row["note_type"]
                or "written",

                "file_name":
                row["file_name"]
                or "",

                "file_url":
                row["file_url"]
                or ""

            })

        return jsonify({

            "success": True,

            "notes":
            notes

        })

    except Exception as e:

        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES DESK - CREATE NOTE
# ============================================================

@app.route(
    "/api/notes",
    methods=["POST"]
)
def create_note():

    data = request.get_json() or {}

    user_id = data.get(
        "user_id"
    )

    title = data.get(
        "title",
        "Untitled Note"
    )

    content = data.get(
        "content",
        ""
    )

    drawing_data = data.get(
        "drawing_data",
        ""
    )

    category = data.get(
        "category",
        "Uncategorized"
    )

    if not user_id:

        return jsonify({

            "success": False,

            "message":
            "user_id is required"

        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO notes
            (
                user_id,
                title,
                content,
                drawing_data,
                category,
                note_type,
                file_name,
                file_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                title,
                content,
                drawing_data,
                category,
                "written",
                "",
                ""
            )
        )

        note_id = cursor.lastrowid

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Note created successfully",

            "note_id":
            note_id

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES DESK - UPDATE NOTE
# ============================================================

@app.route(
    "/api/notes/<int:note_id>",
    methods=["PUT"]
)
def update_note(note_id):

    data = request.get_json() or {}

    title = data.get(
        "title",
        "Untitled Note"
    )

    content = data.get(
        "content",
        ""
    )

    drawing_data = data.get(
        "drawing_data",
        ""
    )

    category = data.get(
        "category",
        None
    )

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM notes
            WHERE id = ?
            """,
            (note_id,)
        )

        note = cursor.fetchone()

        if not note:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "Note not found"

            }), 404

        current_category = (
            note["category"]
            if "category" in note.keys()
            else "Uncategorized"
        )

        new_category = (
            category
            if category is not None
            else (
                current_category
                or "Uncategorized"
            )
        )

        cursor.execute(
            """
            UPDATE notes
            SET
                title = ?,
                content = ?,
                drawing_data = ?,
                category = ?
            WHERE id = ?
            """,
            (
                title,
                content,
                drawing_data,
                new_category,
                note_id
            )
        )

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Note updated successfully"

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES DESK - UPLOAD PDF
# ============================================================

@app.route(
    "/api/notes/upload",
    methods=["POST"]
)
def upload_note_pdf():

    user_id = request.form.get(
        "user_id",
        type=int
    )

    category = (
        request.form.get(
            "category",
            "Uncategorized"
        )
        or
        "Uncategorized"
    ).strip()

    if not user_id:

        return jsonify({

            "success": False,

            "message":
            "user_id is required"

        }), 400

    if "file" not in request.files:

        return jsonify({

            "success": False,

            "message":
            "PDF file is required"

        }), 400

    file = request.files["file"]

    if not file or not file.filename:

        return jsonify({

            "success": False,

            "message":
            "Please select a PDF file"

        }), 400

    if not allowed_file(
        file.filename
    ):

        return jsonify({

            "success": False,

            "message":
            "Only PDF files are allowed"

        }), 400

    # --------------------------------------------------------
    # VERIFY USER
    # --------------------------------------------------------

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "User not found"

            }), 404

    except Exception as e:

        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500

    conn.close()

    # --------------------------------------------------------
    # SAFE FILE NAME
    # --------------------------------------------------------

    original_filename = secure_filename(
        file.filename
    )

    if not original_filename:

        return jsonify({

            "success": False,

            "message":
            "Invalid file name"

        }), 400

    unique_name = (
        f"{uuid.uuid4().hex}_"
        f"{original_filename}"
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_name
    )

    try:

        # ----------------------------------------------------
        # SAVE FILE
        # ----------------------------------------------------

        file.save(
            file_path
        )

        # ----------------------------------------------------
        # EXTRACT PDF TEXT
        # ----------------------------------------------------

        extracted_pages = []

        reader = PdfReader(
            file_path
        )

        for page in reader.pages:

            try:

                page_text = (
                    page.extract_text()
                    or ""
                )

                if page_text.strip():

                    extracted_pages.append(
                        page_text.strip()
                    )

            except Exception:

                continue

        extracted_text = "\n\n".join(
            extracted_pages
        ).strip()

        if not extracted_text:

            extracted_text = (
                "No selectable text could be "
                "extracted from this PDF. "
                "It may contain scanned images."
            )

        # ----------------------------------------------------
        # TITLE
        # ----------------------------------------------------

        title = os.path.splitext(
            original_filename
        )[0]

        # ----------------------------------------------------
        # FILE URL
        # ----------------------------------------------------

        file_url = (
            "/uploads/notes/"
            + unique_name
        )

        # ----------------------------------------------------
        # SAVE IN DATABASE
        # ----------------------------------------------------

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO notes
            (
                user_id,
                title,
                content,
                drawing_data,
                category,
                note_type,
                file_name,
                file_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                title,
                extracted_text,
                "",
                category,
                "pdf",
                original_filename,
                file_url
            )
        )

        note_id = cursor.lastrowid

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "PDF uploaded successfully",

            "note": {

                "id":
                note_id,

                "user_id":
                user_id,

                "title":
                title,

                "content":
                extracted_text,

                "drawing_data":
                "",

                "category":
                category,

                "note_type":
                "pdf",

                "file_name":
                original_filename,

                "file_url":
                file_url

            }

        })

    except Exception as e:

        if os.path.exists(
            file_path
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception:

                pass

        return jsonify({

            "success": False,

            "message":
            f"PDF upload failed: {str(e)}"

        }), 500


# ============================================================
# NOTES - SERVE UPLOADED FILES
# ============================================================

@app.route(
    "/uploads/notes/<path:filename>",
    methods=["GET"]
)
def serve_note_file(filename):

    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )


# ============================================================
# NOTES - DELETE
# ============================================================

@app.route(
    "/api/notes/<int:note_id>",
    methods=["DELETE"]
)
def delete_note(note_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM notes
            WHERE id = ?
            """,
            (note_id,)
        )

        note = cursor.fetchone()

        if not note:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "Note not found"

            }), 404

        file_name = ""

        if "file_url" in note.keys():

            file_url = (
                note["file_url"]
                or ""
            )

            if file_url:

                file_name = os.path.basename(
                    file_url
                )

        cursor.execute(
            """
            DELETE FROM notes
            WHERE id = ?
            """,
            (note_id,)
        )

        conn.commit()
        conn.close()

        if file_name:

            file_path = os.path.join(
                UPLOAD_FOLDER,
                file_name
            )

            if os.path.exists(
                file_path
            ):

                try:

                    os.remove(
                        file_path
                    )

                except Exception as e:

                    print(
                        "Could not delete uploaded file:",
                        e
                    )

        return jsonify({

            "success": True,

            "message":
            "Note deleted successfully"

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES - UPDATE CATEGORY / MOVE TO FOLDER
# ============================================================

@app.route(
    "/api/notes/<int:note_id>/folder",
    methods=["PUT"]
)
def move_note_to_folder(note_id):

    data = request.get_json() or {}

    category = (
        data.get(
            "category",
            "Uncategorized"
        )
        or
        "Uncategorized"
    ).strip()

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM notes
            WHERE id = ?
            """,
            (note_id,)
        )

        note = cursor.fetchone()

        if not note:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                "Note not found"

            }), 404

        cursor.execute(
            """
            UPDATE notes
            SET category = ?
            WHERE id = ?
            """,
            (
                category,
                note_id
            )
        )

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Note moved successfully",

            "category":
            category

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES - GET FOLDERS
# ============================================================

@app.route(
    "/api/note-folders/<int:user_id>",
    methods=["GET"]
)
def get_note_folders(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT DISTINCT category
            FROM notes
            WHERE user_id = ?
            AND category IS NOT NULL
            AND TRIM(category) != ''
            ORDER BY category COLLATE NOCASE
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        conn.close()

        folders = [

            row["category"]

            for row in rows

            if row["category"]

        ]

        if not folders:

            folders = [
                "Uncategorized"
            ]

        return jsonify({

            "success": True,

            "folders":
            folders

        })

    except Exception as e:

        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# NOTES HELPER FOR RAG
# ============================================================
# ============================================================
# SEMANTIC RAG HELPERS
# ============================================================

def chunk_text(text, chunk_size=900, overlap=150):
    text = (text or "").strip()

    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = end - overlap

    return chunks


def cosine_similarity(vec1, vec2):
    if not vec1 or not vec2:
        return 0.0

    length = min(len(vec1), len(vec2))

    dot = sum(vec1[i] * vec2[i] for i in range(length))
    norm1 = math.sqrt(sum(vec1[i] ** 2 for i in range(length)))
    norm2 = math.sqrt(sum(vec2[i] ** 2 for i in range(length)))

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot / (norm1 * norm2)


def generate_embedding(text, task_type):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-embedding-001:embedContent?key="
        + api_key
    )

    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [
                {
                    "text": text
                }
            ]
        },
        "taskType": task_type,
        "outputDimensionality": 768
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))

    return data["embedding"]["values"]

def get_relevant_notes(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                title,
                content,
                note_type
            FROM notes
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 20
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        conn.close()

        return [

            {

                "id":
                row["id"],

                "title":
                row["title"],

                "content":
                row["content"] or "",

                "note_type":
                (
                    row["note_type"]
                    if "note_type"
                    in row.keys()
                    else "written"
                )

            }

            for row in rows

        ]

    except Exception:

        conn.close()

        return []

def index_note(note_id, user_id, text):
    chunks = chunk_text(text)

    if not chunks:
        return

    conn = get_db()
    cursor = conn.cursor()

    try:
        # Purane chunks hatao, taaki re-index par duplicates na bane
        cursor.execute(
            "DELETE FROM note_chunks WHERE note_id = ?",
            (note_id,)
        )

        for index, chunk in enumerate(chunks):
            embedding = generate_embedding(
                chunk,
                "RETRIEVAL_DOCUMENT"
            )

            cursor.execute(
                """
                INSERT INTO note_chunks
                (note_id, user_id, chunk_index, content, embedding)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    note_id,
                    user_id,
                    index,
                    chunk,
                    json.dumps(embedding)
                )
            )

        conn.commit()

    finally:
        conn.close()
def ensure_user_notes_indexed(user_id):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, content
            FROM notes
            WHERE user_id = ?
              AND content IS NOT NULL
              AND TRIM(content) != ''
            """,
            (user_id,)
        )

        notes = cursor.fetchall()

        for note in notes:
            cursor.execute(
                """
                SELECT COUNT(*) AS count
                FROM note_chunks
                WHERE note_id = ?
                """,
                (note["id"],)
            )

            result = cursor.fetchone()

            if result["count"] == 0:
                # Connection close karke embedding function ko
                # independently DB use karne denge.
                conn.commit()
                conn.close()

                index_note(
                    note["id"],
                    user_id,
                    note["content"]
                )

                conn = get_db()
                cursor = conn.cursor()

        conn.commit()

    finally:
        try:
            conn.close()
        except Exception:
            pass
def semantic_search(user_id, query, top_k=6):
    ensure_user_notes_indexed(user_id)

    query_embedding = generate_embedding(
        query,
        "RETRIEVAL_QUERY"
    )

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                id,
                note_id,
                content,
                embedding
            FROM note_chunks
            WHERE user_id = ?
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        results = []

        for row in rows:
            try:
                embedding = json.loads(row["embedding"])

                score = cosine_similarity(
                    query_embedding,
                    embedding
                )

                results.append(
                    {
                        "id": row["id"],
                        "note_id": row["note_id"],
                        "content": row["content"],
                        "score": score
                    }
                )

            except Exception:
                continue

        results.sort(
            key=lambda item: item["score"],
            reverse=True
        )

        return results[:top_k]

    finally:
        conn.close()
# ============================================================
# QUIZ - GENERATE
# ============================================================

@app.route(
    "/api/quiz/generate",
    methods=["POST"]
)
def generate_quiz():

    data = request.get_json() or {}

    user_id = data.get(
        "user_id"
    )

    source = data.get(
        "source",
        "subject"
    )

    subject = data.get(
        "subject",
        "Statistics"
    )

    notes_text = data.get(
        "notes",
        ""
    )

    difficulty = data.get(
        "difficulty",
        "Adaptive"
    )

    question_count = int(
        data.get(
            "question_count",
            5
        )
    )

    # --------------------------------------------------------
    # ADAPTIVE DIFFICULTY
    # --------------------------------------------------------

    actual_difficulty = difficulty

    if difficulty == "Adaptive" and user_id:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                score,
                difficulty
            FROM quiz_attempts
            WHERE user_id = ?
            AND subject = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (
                user_id,
                subject
            )
        )

        previous = cursor.fetchone()

        conn.close()

        if not previous:

            actual_difficulty = (
                "Intermediate"
            )

        else:

            previous_score = (
                previous["score"]
                or 0
            )

            previous_difficulty = (
                previous["difficulty"]
                or "Intermediate"
            )

            if previous_score <= 40:

                if previous_difficulty == "Advanced":

                    actual_difficulty = (
                        "Intermediate"
                    )

                elif previous_difficulty == "Intermediate":

                    actual_difficulty = (
                        "Beginner"
                    )

                else:

                    actual_difficulty = (
                        "Beginner"
                    )

            elif previous_score >= 80:

                if previous_difficulty == "Beginner":

                    actual_difficulty = (
                        "Intermediate"
                    )

                elif previous_difficulty == "Intermediate":

                    actual_difficulty = (
                        "Advanced"
                    )

                else:

                    actual_difficulty = (
                        "Advanced"
                    )

            else:

                actual_difficulty = (
                    previous_difficulty
                )

    # --------------------------------------------------------
    # NOTES / RAG CONTEXT
    # --------------------------------------------------------

    if source == "notes" and user_id:

        notes = get_relevant_notes(
            user_id
        )

        if notes:

            notes_text = "\n\n".join(

                [

                    (
                        f"NOTE: {note['title']}\n"
                        f"{note['content']}"
                    )

                    for note in notes

                    if note["content"].strip()

                ]

            )

    # --------------------------------------------------------
    # PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are the adaptive quiz engine of Sankhyiki Saarthi.

Generate exactly {question_count} multiple-choice questions.

Subject:
{subject}

Difficulty:
{actual_difficulty}

Learning source:
{source}

Notes / learning material:
{notes_text}

Rules:

1. Questions must genuinely match the requested difficulty.
2. Each question must have exactly 4 options.
3. Exactly one option must be correct.
4. Questions should test understanding, not only memorization.
5. Do not repeat the same question.
6. Keep explanations short and educational.
7. If notes are supplied, prioritize those notes.

Return ONLY valid JSON.

Format:

[
  {{
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": "Option A",
    "explanation": "Short explanation"
  }}
]

Do not use markdown.
Do not add anything outside the JSON.
"""

    try:

        response = call_gemini(
            prompt,
            temperature=0.5
        )

        cleaned = response.strip()

        if cleaned.startswith("```"):

            cleaned = (
                cleaned
                .replace(
                    "```json",
                    ""
                )
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

        questions = json.loads(
            cleaned
        )

        return jsonify({

            "success": True,

            "difficulty":
            actual_difficulty,

            "subject":
            subject,

            "questions":
            questions

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# QUIZ - SAVE ATTEMPT
# ============================================================

@app.route(
    "/api/quiz/attempt",
    methods=["POST"]
)
def save_quiz_attempt():

    data = request.get_json() or {}

    user_id = data.get("user_id")

    subject = data.get(
        "subject",
        "Statistics"
    )

    score = data.get(
        "score",
        0
    )

    difficulty = data.get(
        "difficulty",
        "Intermediate"
    )

    # ------------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------------

    if not user_id:

        return jsonify({
            "success": False,
            "message": "user_id is required"
        }), 400

    try:
        user_id = int(user_id)
        score = int(score)

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid user_id or score"
        }), 400

    score = max(0, min(score, 100))

    subject = str(subject).strip()

    if not subject:
        subject = "Statistics"

    conn = get_db()
    cursor = conn.cursor()

    try:

        # --------------------------------------------------------
        # 1. SAVE QUIZ ATTEMPT
        # --------------------------------------------------------

        cursor.execute(
            """
            INSERT INTO quiz_attempts
            (
                user_id,
                subject,
                score,
                difficulty
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                user_id,
                subject,
                score,
                difficulty
            )
        )

        attempt_id = cursor.lastrowid

        # --------------------------------------------------------
        # 2. MAP QUIZ SUBJECT TO COMPETENCY
        # --------------------------------------------------------

        subject_lower = subject.lower()

        if "stat" in subject_lower:
            competency_name = "Statistical Methods"

        elif (
            "probability" in subject_lower
            or "sampling" in subject_lower
        ):
            competency_name = "Probability & Sampling"

        elif (
            "interpret" in subject_lower
            or "data analysis" in subject_lower
        ):
            competency_name = "Data Interpretation"

        elif (
            "visual" in subject_lower
            or "chart" in subject_lower
            or "graph" in subject_lower
        ):
            competency_name = "Data Visualization"

        elif (
            "official" in subject_lower
            or "government statistics" in subject_lower
        ):
            competency_name = "Official Statistics"

        elif (
            "quality" in subject_lower
            or "metadata" in subject_lower
        ):
            competency_name = "Data Quality & Metadata"

        else:
            competency_name = subject

        # --------------------------------------------------------
        # 3. CALCULATE THIS USER'S AVERAGE SCORE
        # --------------------------------------------------------

        cursor.execute(
            """
            SELECT AVG(score) AS average_score
            FROM quiz_attempts
            WHERE user_id = ?
            AND subject = ?
            """,
            (
                user_id,
                subject
            )
        )

        result = cursor.fetchone()

        average_score = 0

        if result and result["average_score"] is not None:

            average_score = round(
                float(result["average_score"])
            )

        # --------------------------------------------------------
        # 4. CHECK USER'S EXISTING COMPETENCY
        # --------------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM competencies
            WHERE user_id = ?
            AND competency = ?
            """,
            (
                user_id,
                competency_name
            )
        )

        existing = cursor.fetchone()

        # --------------------------------------------------------
        # 5. UPDATE OR CREATE COMPETENCY
        # --------------------------------------------------------

        if existing:

            cursor.execute(
                """
                UPDATE competencies
                SET score = ?
                WHERE user_id = ?
                AND competency = ?
                """,
                (
                    average_score,
                    user_id,
                    competency_name
                )
            )

        else:

            cursor.execute(
                """
                INSERT INTO competencies
                (
                    user_id,
                    competency,
                    score
                )
                VALUES (?, ?, ?)
                """,
                (
                    user_id,
                    competency_name,
                    average_score
                )
            )

        # --------------------------------------------------------
        # 6. COMMIT
        # --------------------------------------------------------

        conn.commit()

        # --------------------------------------------------------
        # 7. RESPONSE
        # --------------------------------------------------------

        return jsonify({

            "success": True,

            "message":
            "Quiz attempt saved and competency updated",

            "attempt_id":
            attempt_id,

            "user_id":
            user_id,

            "subject":
            subject,

            "score":
            score,

            "difficulty":
            difficulty,

            "competency":
            competency_name,

            "competency_score":
            average_score

        })

    except Exception as e:

        conn.rollback()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500

    finally:

        conn.close()
# ============================================================
# COMPETENCIES
# ============================================================

@app.route(
    "/api/competencies/<int:user_id>",
    methods=["GET"]
)
def get_competencies(user_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                competency,
                score
            FROM competencies
            WHERE user_id = ?
            ORDER BY id
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        conn.close()

        return jsonify({

            "success": True,

            "competencies": [
                dict(row)
                for row in rows
            ]

        })

    except Exception as e:

        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# STUDY MATERIALS - GET
# ============================================================

@app.route(
    "/api/study-materials",
    methods=["GET"]
)
def get_study_materials():

    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "user_id is required"
        }), 400

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Invalid user_id"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            SELECT *
            FROM study_materials
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        return jsonify({

            "success": True,

            "materials": [
                dict(row)
                for row in rows
            ]

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

    finally:
        conn.close()
# ============================================================
# STUDY MATERIALS - POST
# ============================================================

@app.route(
    "/api/study-materials",
    methods=["POST"]
)
def create_study_material():

    data = request.get_json() or {}

    title = data.get(
        "title",
        ""
    )

    description = data.get(
        "description",
        ""
    )

    file_url = data.get(
        "file_url",
        ""
    )

    subject = data.get(
        "subject",
        ""
    )

    provider = data.get(
        "provider",
        "iGOT Karmayogi"
    )

    if not title:

        return jsonify({

            "success": False,

            "message":
            "Title is required"

        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO study_materials
            (
                title,
                description,
                file_url,
                subject,
                provider
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                title,
                description,
                file_url,
                subject,
                provider
            )
        )

        material_id = cursor.lastrowid

        conn.commit()
        conn.close()

        return jsonify({

            "success": True,

            "message":
            "Study material created",

            "id":
            material_id

        })

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# RECOMMENDATIONS
# ============================================================

@app.route(
    "/api/recommendations",
    methods=["GET"]
)
def recommendations():

    user_id = request.args.get(
        "user_id",
        type=int
    )

    if not user_id:

        user_id = 1

    conn = get_db()
    cursor = conn.cursor()

    try:

        # ====================================================
        # 1. GET USER COMPETENCIES
        # ====================================================

        cursor.execute(
            """
            SELECT
                competency,
                score
            FROM competencies
            WHERE user_id = ?
            ORDER BY score ASC
            """,
            (user_id,)
        )

        competency_rows = cursor.fetchall()

        competencies = []

        for row in competency_rows:

            competencies.append({

                "competency":
                row["competency"],

                "score":
                int(
                    row["score"]
                    or 0
                )

            })

        competency_gaps = [

            item

            for item in competencies

            if item["score"] < 70

        ]

        # ====================================================
        # 2. GET RECENT QUIZ PERFORMANCE
        # ====================================================

        cursor.execute(
            """
            SELECT
                score,
                subject,
                difficulty
            FROM quiz_attempts
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 10
            """,
            (user_id,)
        )

        quiz_rows = cursor.fetchall()

        if quiz_rows:

            quiz_accuracy = round(

                sum(
                    int(
                        row["score"]
                        or 0
                    )
                    for row in quiz_rows
                )
                /
                len(quiz_rows)

            )

        else:

            quiz_accuracy = 0

        recent_subject = ""

        if quiz_rows:

            recent_subject = (
                quiz_rows[0]["subject"]
                or ""
            ).strip()

        # ====================================================
        # 3. GET LEARNING HISTORY
        # ====================================================

        cursor.execute(
            """
            SELECT *
            FROM learning_progress
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,)
        )

        progress_rows = cursor.fetchall()

        completed_courses = []
        active_courses = []

        for row in progress_rows:

            row_keys = row.keys()

            title = ""

            if "title" in row_keys:

                title = (
                    row["title"]
                    or ""
                ).strip()

            title_normalized = (
                title.lower().strip()
            )

            if not title_normalized:

                continue

            status = ""

            if "status" in row_keys:

                status = (
                    row["status"]
                    or ""
                ).strip().lower()

            progress = 0

            if "progress" in row_keys:

                try:

                    progress = int(
                        row["progress"]
                        or 0
                    )

                except Exception:

                    progress = 0

            if (
                status in [
                    "completed",
                    "complete",
                    "done",
                    "finished"
                ]
                or
                progress >= 100
            ):

                completed_courses.append(
                    title_normalized
                )

            else:

                active_courses.append(
                    title_normalized
                )

        # ====================================================
        # 4. NORMALIZATION
        # ====================================================

        def normalize_text(value):

            return (
                str(value or "")
                .lower()
                .replace("&", "and")
                .replace("-", " ")
                .replace("_", " ")
                .strip()
            )

        # ====================================================
        # 5. COURSE CATALOG
        # ====================================================

        course_catalog = [

            {

                "title":
                "Data Visualization Fundamentals",

                "description":
                "Learn how to turn datasets into clear charts, graphs and visual insights.",

                "provider":
                "iGOT Karmayogi",

                "category":
                "Data Visualization",

                "skills":
                [
                    "Data Visualization",
                    "Data Analysis"
                ],

                "url":
                "https://igotkarmayogi.gov.in/"

            },

            {

                "title":
                "Statistical Reasoning Essentials",

                "description":
                "Strengthen your understanding of statistical thinking, interpretation and evidence-based reasoning.",

                "provider":
                "iGOT Karmayogi",

                "category":
                "Statistics",

                "skills":
                [
                    "Statistical Reasoning",
                    "Data Analysis"
                ],

                "url":
                "https://igotkarmayogi.gov.in/"

            },

            {

                "title":
                "Research Methods and Data Analysis",

                "description":
                "Build practical research skills including data interpretation, evidence and structured analysis.",

                "provider":
                "iGOT Karmayogi",

                "category":
                "Research",

                "skills":
                [
                    "Research Skills",
                    "Data Analysis",
                    "Statistical Reasoning"
                ],

                "url":
                "https://igotkarmayogi.gov.in/"

            },

            {

                "title":
                "Excel for Data Analysis",

                "description":
                "Develop practical spreadsheet skills for organizing, analysing and interpreting data.",

                "provider":
                "iGOT Karmayogi",

                "category":
                "Excel",

                "skills":
                [
                    "Data Analysis",
                    "Excel & Spreadsheets"
                ],

                "url":
                "https://igotkarmayogi.gov.in/"

            },

            {

                "title":
                "Evidence-Based Decision Making",

                "description":
                "Learn how data and evidence can support structured decisions and better problem solving.",

                "provider":
                "iGOT Karmayogi",

                "category":
                "Decision Making",

                "skills":
                [
                    "Data Analysis",
                    "Statistical Reasoning"
                ],

                "url":
                "https://igotkarmayogi.gov.in/"

            },

            {

                "title":
                "Problem Solving with Data",

                "description":
                "Use structured analytical approaches to understand problems and make data-informed decisions.",

                "provider":
                "iGOT Karmayogi",

                "category":
                "Problem Solving",

                "skills":
                [
                    "Data Analysis",
                    "Research Skills"
                ],

                "url":
                "https://igotkarmayogi.gov.in/"

            }

        ]

        # ====================================================
        # 6. REMOVE COMPLETED / ACTIVE COURSES
        # ====================================================

        available_courses = []

        for course in course_catalog:

            course_title = normalize_text(
                course["title"]
            )

            already_completed = False
            currently_learning = False

            for completed in completed_courses:

                completed_normalized = normalize_text(
                    completed
                )

                if (
                    course_title ==
                    completed_normalized
                    or
                    course_title in
                    completed_normalized
                    or
                    completed_normalized in
                    course_title
                ):

                    already_completed = True

                    break

            if already_completed:

                continue

            for active in active_courses:

                active_normalized = normalize_text(
                    active
                )

                if (
                    course_title ==
                    active_normalized
                    or
                    course_title in
                    active_normalized
                    or
                    active_normalized in
                    course_title
                ):

                    currently_learning = True

                    break

            if currently_learning:

                continue

            available_courses.append(
                course
            )

        # ====================================================
        # 7. COMPETENCY LOOKUP
        # ====================================================

        competency_lookup = {}

        for item in competencies:

            competency_lookup[
                normalize_text(
                    item["competency"]
                )
            ] = item["score"]

        # ====================================================
        # 8. SCORE COURSES
        # ====================================================

        scored_courses = []

        for course in available_courses:

            matched_skills = []

            for skill in course["skills"]:

                skill_normalized = normalize_text(
                    skill
                )

                if skill_normalized in competency_lookup:

                    matched_skills.append({

                        "skill":
                        skill,

                        "score":
                        competency_lookup[
                            skill_normalized
                        ]

                    })

                    continue

                for (
                    competency_name,
                    competency_score
                ) in competency_lookup.items():

                    if (
                        skill_normalized
                        in competency_name
                        or
                        competency_name
                        in skill_normalized
                    ):

                        matched_skills.append({

                            "skill":
                            skill,

                            "score":
                            competency_score

                        })

                        break

            if matched_skills:

                weakest_skill = min(
                    matched_skills,
                    key=lambda item:
                    item["score"]
                )

                weakest_score = (
                    weakest_skill["score"]
                )

                recommendation_score = (
                    100 - weakest_score
                )

            else:

                weakest_skill = None
                weakest_score = None
                recommendation_score = 5

            # ------------------------------------------------
            # QUIZ PERFORMANCE
            # ------------------------------------------------

            if quiz_accuracy > 0:

                if quiz_accuracy < 40:

                    if (
                        "Data Analysis"
                        in course["skills"]
                        or
                        "Statistical Reasoning"
                        in course["skills"]
                    ):

                        recommendation_score += 25

                    else:

                        recommendation_score += 8

                elif quiz_accuracy < 60:

                    recommendation_score += 12

                elif quiz_accuracy < 75:

                    recommendation_score += 5

            # ------------------------------------------------
            # RECENT QUIZ SUBJECT
            # ------------------------------------------------

            if recent_subject:

                subject_normalized = normalize_text(
                    recent_subject
                )

                category_normalized = normalize_text(
                    course["category"]
                )

                if (
                    subject_normalized
                    in category_normalized
                    or
                    category_normalized
                    in subject_normalized
                ):

                    recommendation_score += 10

            # ------------------------------------------------
            # WHY
            # ------------------------------------------------

            if weakest_skill:

                why = (
                    f"Recommended because your "
                    f"{weakest_skill['skill']} competency "
                    f"is currently {weakest_skill['score']}%. "
                    f"This course directly supports that "
                    f"skill and gives you an opportunity "
                    f"to strengthen it."
                )

                based_on = (
                    f"{weakest_skill['skill']} competency"
                )

            elif (
                quiz_accuracy > 0
                and
                quiz_accuracy < 60
            ):

                why = (
                    f"Recommended because your recent "
                    f"quiz accuracy is {quiz_accuracy}%. "
                    f"This course provides additional "
                    f"practice for analytical learning."
                )

                based_on = (
                    "Quiz performance"
                )

            elif recent_subject:

                why = (
                    f"Recommended because it connects "
                    f"with your recent learning activity "
                    f"in {recent_subject}."
                )

                based_on = (
                    "Recent learning activity"
                )

            else:

                why = (
                    "Recommended as a complementary "
                    "learning resource based on your "
                    "current learning profile."
                )

                based_on = (
                    "Learning profile"
                )

            course_copy = dict(
                course
            )

            course_copy["why"] = why

            course_copy["based_on"] = (
                based_on
            )

            course_copy["_score"] = (
                recommendation_score
            )

            scored_courses.append(
                course_copy
            )

        # ====================================================
        # 9. SORT
        # ====================================================

        scored_courses.sort(
            key=lambda item: (
                item["_score"],
                item["title"]
            ),
            reverse=True
        )

        # ====================================================
        # 10. TOP 3
        # ====================================================

        recommendations_list = []

        for index, course in enumerate(
            scored_courses[:3]
        ):

            recommendations_list.append({

                "id":
                index + 1,

                "title":
                course["title"],

                "description":
                course["description"],

                "provider":
                course["provider"],

                "category":
                course["category"],

                "url":
                course["url"],

                "why":
                course["why"],

                "based_on":
                course["based_on"]

            })

        # ====================================================
        # 11. LEARNING INTERESTS
        # ====================================================

        learning_interests = []

        strongest = sorted(
            competencies,
            key=lambda item:
            item["score"],
            reverse=True
        )

        for item in strongest:

            name = item["competency"]

            if name not in learning_interests:

                learning_interests.append(
                    name
                )

            if len(
                learning_interests
            ) >= 3:

                break

        if not learning_interests:

            learning_interests = [
                "Data & Analytics"
            ]

        # ====================================================
        # 12. RESPONSE
        # ====================================================

        return jsonify({

            "success":
            True,

            "recommendations":
            recommendations_list,

            "competency_gaps":
            competency_gaps,

            "quiz_accuracy":
            quiz_accuracy,

            "recent_quiz_subject":
            recent_subject,

            "learning_interests":
            learning_interests,

            "completed_count":
            len(
                completed_courses
            ),

            "active_count":
            len(
                active_courses
            ),

            "available_count":
            len(
                available_courses
            )

        })

    except Exception as e:

        print(
            "Recommendations error:",
            e
        )

        return jsonify({

            "success":
            False,

            "message":
            str(e)

        }), 500

    finally:

        try:

            conn.close()

        except Exception:

            pass


# ============================================================
# SUMMARIZE
# ============================================================

@app.route(
    "/api/summarize",
    methods=["POST"]
)
def summarize():

    data = request.get_json() or {}

    text = data.get(
        "text",
        ""
    ).strip()

    if not text:

        return jsonify({

            "success": False,

            "message":
            "Text is required"

        }), 400

    prompt = f"""
Summarize the following study material for a student.

Requirements:
- Keep the important concepts.
- Use simple language.
- Use short sections.
- Include key points.
- Do not invent information.
- Do not use excessive detail.

Text:

{text}
"""

    try:

        summary = call_gemini(
            prompt,
            temperature=0.3,
            model="gemini-3.6-flash"
        )

        return jsonify({

            "success": True,

            "summary":
            summary

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# SUMMARIZE PDF
# ============================================================

@app.route(
    "/api/summarize-pdf",
    methods=["POST"]
)
def summarize_pdf():

    mode = request.form.get(
        "mode",
        "Short"
    )

    if "file" not in request.files:

        return jsonify({

            "success": False,

            "message":
            "PDF file is required"

        }), 400

    file = request.files["file"]

    if not file or not file.filename:

        return jsonify({

            "success": False,

            "message":
            "Please select a PDF file"

        }), 400

    if not allowed_file(
        file.filename
    ):

        return jsonify({

            "success": False,

            "message":
            "Only PDF files are allowed"

        }), 400

    try:

        reader = PdfReader(
            file
        )

        extracted_pages = []

        for page in reader.pages:

            try:

                page_text = (
                    page.extract_text()
                    or ""
                )

                if page_text.strip():

                    extracted_pages.append(
                        page_text.strip()
                    )

            except Exception:

                continue

        extracted_text = "\n\n".join(
            extracted_pages
        ).strip()

        if not extracted_text:

            return jsonify({

                "success": False,

                "message":
                "No selectable text could be extracted from this PDF. It may contain scanned images."

            }), 400

        extracted_text = (
            extracted_text[:30000]
        )

        mode_prompts = {

            "Short":
            """
Create a concise summary.
Keep only the most important ideas, concepts,
facts, and conclusions.
Use short bullet points and simple language.
""",

            "Detailed":
            """
Create a detailed but easy-to-understand summary.
Cover the important concepts, explanations,
examples, facts, and conclusions from the document.
Organize the answer into clear sections.
""",

            "ELI5":
            """
Explain the document as if teaching it to a beginner.
Use very simple language, everyday examples where
helpful, and explain difficult terms.
Do not remove important concepts.
""",

            "Exam":
            """
Create exam-ready study notes.
Focus on definitions, formulas, important concepts,
key facts, comparisons, steps, and likely exam points.
Use clear headings and concise bullet points.
"""

        }

        selected_prompt = mode_prompts.get(
            mode,
            mode_prompts["Short"]
        )

        prompt = f"""
You are the study-material summarizer for
Sankhyiki Saarthi.

Summarize the following PDF content.

Summary mode:
{mode}

{selected_prompt}

Important rules:
- Use ONLY information present in the PDF text.
- Do not invent or add outside information.
- Preserve important terminology, numbers,
  formulas, names, and facts from the source.
- Make the result useful for a student.
- Do not mention that you are an AI.
- Do not use markdown tables unless absolutely necessary.

PDF content:

{extracted_text}
"""

        summary = call_gemini(
            prompt,
            temperature=0.3,
            model="gemini-3.6-flash"
        )

        return jsonify({

            "success": True,

            "summary":
            summary,

            "mode":
            mode,

            "filename":
            file.filename

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            f"PDF summarization failed: {str(e)}"

        }), 500


# ============================================================
# AI CHAT
# ============================================================

@app.route(
    "/api/chat",
    methods=["POST"]
)
def chat():

    data = request.get_json() or {}

    message = data.get(
        "message",
        ""
    ).strip()

    user_id = data.get(
        "user_id"
    )

    if not message:

        return jsonify({

            "success": False,

            "message":
            "Message is required"

        }), 400

    context = ""

    if user_id:

        notes = semantic_search(
    user_id,
    message,
    top_k=6
)

        if notes:

            context = "\n\n".join(

                [

                   (
    f"Relevant Note Content:\n"
    f"{note['content']}"
)

for note in notes

if note["content"].strip()
                ]

            )

    prompt = f"""
You are Sankhyiki Saarthi,
an AI learning assistant.

The user is asking:

{message}

Relevant notes from the student's Notes Desk:

{context}

Answer helpfully and accurately.

Rules:
- Explain concepts simply.
- You may use Hinglish if the user uses Hinglish.
- Do not invent facts.
- Keep the response focused.
- Help the student learn rather than just giving unexplained answers.
"""

    try:

        response = call_gemini(
            prompt,
            temperature=0.6
        )

        return jsonify({

            "success": True,

            "response":
            response

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            str(e)

        }), 500


# ============================================================
# TEST UPLOAD
# ============================================================

@app.route(
    "/api/test-upload",
    methods=["POST"]
)
def test_upload():

    return jsonify({

        "success": True,

        "message":
        "Upload endpoint is working"

    })


# ============================================================
# HANDLE LARGE FILE ERROR
# ============================================================

@app.errorhandler(
    413
)
def file_too_large(error):

    return jsonify({

        "success": False,

        "message":
        "File is too large. Maximum size is 15 MB."

    }), 413


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )