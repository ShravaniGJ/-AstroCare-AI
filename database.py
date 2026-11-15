
import sqlite3

def create_database():

    conn = sqlite3.connect("astronaut.db")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            astronaut_id TEXT NOT NULL,
            heart_rate REAL,
            blood_pressure TEXT,
            spo2 REAL,
            temperature REAL,
            stress_level REAL,
            sleep_hours REAL,
            radiation_level REAL,
            recorded_at TEXT
        )
    """)

    conn.commit()
    conn.close()

    print("Database created successfully!")


if __name__ == "__main__":
    create_database()
