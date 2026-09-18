from database import get_db, init_db


def seed_database():
    init_db()

    conn = get_db()
    cursor = conn.cursor()

    # --------------------------------------------------
    # DEMO USER — SAMRIDDHI
    # --------------------------------------------------
    cursor.execute(
        """
        INSERT OR IGNORE INTO users
        (name, email, birth_date, profession, college, learning_goal, language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "Samriddhi",
            "samriddhi@demo.com",
            "",
            "Student",
            "MAKAUT",
            "Skill Development",
            "English",
        ),
    )

    conn.commit()

    # Get Samriddhi's ID
    cursor.execute(
        "SELECT id FROM users WHERE email = ?",
        ("samriddhi@demo.com",),
    )

    user = cursor.fetchone()

    if not user:
        print("Could not create demo user.")
        conn.close()
        return

    user_id = user["id"]

    # --------------------------------------------------
    # DEMO LEARNING PROGRESS
    # --------------------------------------------------
    courses = [
        (
            "excel-beginners",
            "Microsoft Excel for Beginners",
            "iGOT Karmayogi",
            68,
        ),
        (
            "data-analytics",
            "Introduction to Data Analytics",
            "iGOT Karmayogi",
            42,
        ),
        (
            "statistics",
            "Statistics for Decision Making",
            "iGOT Karmayogi",
            76,
        ),
    ]

    for course_id, course_name, provider, progress in courses:
        cursor.execute(
            """
            SELECT id FROM learning_progress
            WHERE user_id = ? AND course_id = ?
            """,
            (user_id, course_id),
        )

        if not cursor.fetchone():
            cursor.execute(
                """
                INSERT INTO learning_progress
                (user_id, course_id, course_name, provider, progress)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    course_id,
                    course_name,
                    provider,
                    progress,
                ),
            )

    # --------------------------------------------------
    # DEMO COMPETENCIES
    # --------------------------------------------------
    competencies = [
        ("Data Analysis", 68),
        ("Statistical Reasoning", 61),
        ("Data Visualization", 54),
        ("Excel & Spreadsheets", 72),
        ("Research Skills", 48),
    ]

    for competency, score in competencies:
        cursor.execute(
            """
            SELECT id FROM competencies
            WHERE user_id = ? AND competency = ?
            """,
            (user_id, competency),
        )

        if not cursor.fetchone():
            cursor.execute(
                """
                INSERT INTO competencies
                (user_id, competency, score)
                VALUES (?, ?, ?)
                """,
                (
                    user_id,
                    competency,
                    score,
                ),
            )

    conn.commit()
    conn.close()

    print("Demo data seeded successfully.")
    print("Demo login:")
    print("Email: samriddhi@demo.com")


if __name__ == "__main__":
    seed_database()