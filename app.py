from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS

from pathlib import Path
from datetime import datetime, timezone
from io import BytesIO

import sqlite3
import re
import math

from analyzer import analyze_health

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)


# ==========================================
# FLASK APPLICATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static")
)

CORS(app)

DATABASE = BASE_DIR / "astronaut.db"


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db_connection():

    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row

    return conn


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

def initialize_database():

    conn = get_db_connection()

    try:

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
                recorded_at TEXT,
                bone_density REAL,
                bone_loss_risk REAL,
                muscle_strength REAL,
                muscle_mass REAL,
                exercise_minutes REAL,
                wbc_count REAL,
                inflammation_level REAL

            )
        """)

        existing_columns = {
            row["name"]
            for row in conn.execute(
                "PRAGMA table_info(health_records)"
            ).fetchall()
        }

        new_columns = {
            "bone_density": "REAL",
            "bone_loss_risk": "REAL",
            "muscle_strength": "REAL",
            "muscle_mass": "REAL",
            "exercise_minutes": "REAL",
            "wbc_count": "REAL",
            "inflammation_level": "REAL"
        }

        for column, data_type in new_columns.items():

            if column not in existing_columns:

                conn.execute(
                    f"ALTER TABLE health_records "
                    f"ADD COLUMN {column} {data_type}"
                )

        conn.commit()

        print("AstroCare AI database initialized!")

    finally:

        conn.close()


# Initialize database even when Flask imports the application.
initialize_database()


# ==========================================
# DASHBOARD
# ==========================================

@app.route("/")
def dashboard():

    return render_template("dashboard.html")


# ==========================================
# HEALTH API STATUS
# ==========================================

@app.route("/api/health/status", methods=["GET"])
def health_status():

    return jsonify({
        "status": "success",
        "message": "AstroCare AI Health API is running"
    }), 200


# ==========================================
# NUMERIC VALIDATION
# ==========================================

def convert_number(data, field, required=False):

    value = data.get(field)

    if value is None or value == "":

        if required:
            raise ValueError(
                "Required reading missing: " + field
            )

        return None

    if isinstance(value, bool):

        raise ValueError(
            "Invalid numeric reading: " + field
        )

    try:

        number = float(value)

    except (ValueError, TypeError):

        raise ValueError(
            "Invalid numeric reading: " + field
        )

    if not math.isfinite(number):

        raise ValueError(
            "Non-finite reading: " + field
        )

    return number


# ==========================================
# BLOOD PRESSURE VALIDATION
# ==========================================

def get_blood_pressure(data):

    blood_pressure = str(
        data.get("blood_pressure") or ""
    ).strip()

    systolic = convert_number(
        data,
        "systolic_bp"
    )

    if systolic is not None:

        if not 50 <= systolic <= 250:
            raise ValueError(
                "Blood pressure outside demo input limits"
            )

        if not blood_pressure:
            blood_pressure = str(systolic)

        return blood_pressure, systolic

    match = re.match(
        r"^\s*(\d+(?:\.\d+)?)"
        r"\s*(?:/\s*\d+(?:\.\d+)?)?\s*$",
        blood_pressure
    )

    if not match:

        raise ValueError(
            "Required reading missing: blood_pressure"
        )

    systolic = float(match.group(1))

    if not 50 <= systolic <= 250:

        raise ValueError(
            "Blood pressure outside demo input limits"
        )

    return blood_pressure, systolic


# ==========================================
# RADIATION VALIDATION
# ==========================================

def get_radiation(data):

    value = data.get("radiation_msv")

    if value is None:

        value = data.get("radiation_level")

    if value is None or value == "":

        raise ValueError(
            "Required reading missing: radiation"
        )

    if isinstance(value, bool):

        raise ValueError(
            "Invalid numeric reading: radiation_msv"
        )

    try:

        radiation = float(value)

    except (ValueError, TypeError):

        raise ValueError(
            "Invalid numeric reading: radiation_msv"
        )

    if not math.isfinite(radiation):

        raise ValueError(
            "Non-finite radiation reading"
        )

    if not 0 <= radiation <= 100:

        raise ValueError(
            "Radiation outside demo input limits"
        )

    return radiation


# ==========================================
# SAVE HEALTH DATA
# ==========================================

@app.route("/api/health", methods=["POST"])
def save_health():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):

        return jsonify({
            "error": "Invalid JSON"
        }), 400

    astronaut_id = data.get("astronaut_id")

    if not isinstance(astronaut_id, str) or not astronaut_id.strip():

        return jsonify({
            "error": "Astronaut ID required"
        }), 400

    astronaut_id = astronaut_id.strip()

    conn = None

    try:

        # BLOOD PRESSURE

        blood_pressure, systolic_bp = get_blood_pressure(data)

        # RADIATION

        radiation = get_radiation(data)

        # HEALTH READINGS

        readings = {

            "heart_rate": convert_number(
                data, "heart_rate", True
            ),

            "spo2": convert_number(
                data, "spo2", True
            ),

            "temperature": convert_number(
                data, "temperature", True
            ),

            "systolic_bp": systolic_bp,

            "radiation_msv": radiation,

            "sleep_hours": convert_number(
                data, "sleep_hours"
            ),

            "stress_level": convert_number(
                data, "stress_level"
            ),

            "bone_density": convert_number(
                data, "bone_density"
            ),

            "bone_loss_risk": convert_number(
                data, "bone_loss_risk"
            ),

            "muscle_strength": convert_number(
                data, "muscle_strength"
            ),

            "muscle_mass": convert_number(
                data, "muscle_mass"
            ),

            "exercise_minutes": convert_number(
                data, "exercise_minutes"
            ),

            "wbc_count": convert_number(
                data, "wbc_count"
            ),

            "inflammation_level": convert_number(
                data, "inflammation_level"
            )

        }

        # AI ANALYSIS

        analysis = analyze_health(readings)

        # DATABASE INSERTION

        conn = get_db_connection()

        conn.execute("""

            INSERT INTO health_records (

                astronaut_id,
                heart_rate,
                blood_pressure,
                spo2,
                temperature,
                stress_level,
                sleep_hours,
                radiation_level,
                bone_density,
                bone_loss_risk,
                muscle_strength,
                muscle_mass,
                exercise_minutes,
                wbc_count,
                inflammation_level,
                recorded_at

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        """, (

            astronaut_id,
            readings["heart_rate"],
            blood_pressure,
            readings["spo2"],
            readings["temperature"],
            readings["stress_level"],
            readings["sleep_hours"],
            readings["radiation_msv"],
            readings["bone_density"],
            readings["bone_loss_risk"],
            readings["muscle_strength"],
            readings["muscle_mass"],
            readings["exercise_minutes"],
            readings["wbc_count"],
            readings["inflammation_level"],
            datetime.now(timezone.utc).isoformat()

        ))

        conn.commit()

        return jsonify({

            "message": "Health data saved successfully",
            "astronaut_id": astronaut_id,
            "readings": readings,
            "analysis": analysis

        }), 201

    except (ValueError, TypeError, KeyError) as error:

        return jsonify({
            "error": str(error)
        }), 400

    except sqlite3.Error as error:

        return jsonify({
            "error": "Database error: " + str(error)
        }), 500

    except Exception:

        app.logger.exception("Health data processing failed")

        return jsonify({
            "error": "Health data processing failed"
        }), 500

    finally:

        if conn is not None:
            conn.close()


# ==========================================
# GET HEALTH HISTORY
# ==========================================

@app.route("/api/health/<astronaut_id>", methods=["GET"])
def get_health(astronaut_id):

    conn = get_db_connection()

    try:

        records = conn.execute("""

            SELECT *

            FROM health_records

            WHERE astronaut_id = ?

            ORDER BY id DESC

        """, (astronaut_id,)).fetchall()

        return jsonify([
            dict(row) for row in records
        ]), 200

    except sqlite3.Error:

        app.logger.exception("Health history retrieval failed")

        return jsonify({
            "error": "Unable to retrieve health history"
        }), 500

    finally:

        conn.close()


# ==========================================
# COMMON LATEST AI ANALYSIS
# ==========================================

def get_latest_analysis(astronaut_id):

    conn = get_db_connection()

    try:

        record = conn.execute("""

            SELECT *

            FROM health_records

            WHERE astronaut_id = ?

            ORDER BY id DESC

            LIMIT 1

        """, (astronaut_id,)).fetchone()

    except sqlite3.Error:

        app.logger.exception("AI analysis database error")

        return jsonify({
            "error": "Unable to retrieve health records"
        }), 500

    finally:

        conn.close()

    if record is None:

        return jsonify({
            "error": "No health records found"
        }), 404

    record = dict(record)

    try:

        readings = {

            "heart_rate": record["heart_rate"],
            "spo2": record["spo2"],
            "temperature": record["temperature"],
            "blood_pressure": record["blood_pressure"],
            "radiation_level": record["radiation_level"],
            "sleep_hours": record["sleep_hours"],
            "stress_level": record["stress_level"],
            "bone_density": record["bone_density"],
            "bone_loss_risk": record["bone_loss_risk"],
            "muscle_strength": record["muscle_strength"],
            "muscle_mass": record["muscle_mass"],
            "exercise_minutes": record["exercise_minutes"],
            "wbc_count": record["wbc_count"],
            "inflammation_level": record["inflammation_level"]

        }

        analysis = analyze_health(readings)

        return jsonify({

            "astronaut_id": astronaut_id,
            "analysis": analysis

        }), 200

    except (ValueError, TypeError, KeyError) as error:

        return jsonify({
            "error": str(error)
        }), 400

    except Exception:

        app.logger.exception("AI analysis failed")

        return jsonify({
            "error": "Unable to generate AI analysis"
        }), 500


# ==========================================
# GET ALERTS
# ==========================================

@app.route("/api/alerts/<astronaut_id>", methods=["GET"])
def get_alerts(astronaut_id):

    return get_latest_analysis(astronaut_id)


# ==========================================
# GET AI HEALTH ANALYSIS
# ==========================================

@app.route("/api/ai-analysis/<astronaut_id>", methods=["GET"])
def get_ai_analysis(astronaut_id):

    return get_latest_analysis(astronaut_id)


# ==========================================
# PDF REPORT GENERATION
# ==========================================

def generate_health_pdf(astronaut_id, report_type):

    conn = get_db_connection()

    try:

        records = conn.execute("""

            SELECT *

            FROM health_records

            WHERE astronaut_id = ?

            ORDER BY id DESC

        """, (astronaut_id,)).fetchall()

        records = [dict(row) for row in records]

    finally:

        conn.close()

    if not records:
        return None

    latest = records[0]

    buffer = BytesIO()

    if report_type == "history":

        page_size = landscape(A4)
        margins = 12 * mm

    else:

        page_size = A4
        margins = 18 * mm

    document = SimpleDocTemplate(

        buffer,
        pagesize=page_size,
        rightMargin=margins,
        leftMargin=margins,
        topMargin=18 * mm,
        bottomMargin=18 * mm

    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(

        "ReportTitle",
        parent=styles["Title"],
        fontSize=23,
        textColor=colors.HexColor("#176B87"),
        alignment=1,
        spaceAfter=8

    )

    subtitle_style = ParagraphStyle(

        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#526477"),
        alignment=1,
        spaceAfter=15

    )

    heading_style = ParagraphStyle(

        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#176B87"),
        spaceBefore=12,
        spaceAfter=8

    )

    normal_style = ParagraphStyle(

        "ReportText",
        parent=styles["Normal"],
        fontSize=9,
        leading=13

    )

    small_style = ParagraphStyle(

        "SmallText",
        parent=styles["Normal"],
        fontSize=7,
        leading=9

    )

    story = []

    # REPORT HEADER

    story.append(
        Paragraph("ASTROCARE AI", title_style)
    )

    story.append(
        Paragraph(
            "ASTRONAUT HEALTH MONITORING SYSTEM",
            subtitle_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Mission:</b> Artemis &nbsp;&nbsp; "
            f"<b>Astronaut ID:</b> {astronaut_id}",
            normal_style
        )
    )

    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            f"<b>Report Type:</b> {report_type.upper()} HEALTH REPORT",
            normal_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Total Health Records:</b> {len(records)}",
            normal_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Generated:</b> "
            f"{datetime.now().strftime('%d-%m-%Y %H:%M:%S')}",
            normal_style
        )
    )

    story.append(Spacer(1, 15))

    # LATEST HEALTH PARAMETERS

    if report_type in ["latest", "ai"]:

        story.append(
            Paragraph(
                "Latest Health Parameters",
                heading_style
            )
        )

        health_parameters = [

            ["Health Parameter", "Recorded Value"],

            ["Heart Rate", f"{latest['heart_rate']} BPM"],

            ["Blood Pressure", str(latest["blood_pressure"])],

            ["Blood Oxygen (SpO2)", f"{latest['spo2']} %"],

            ["Body Temperature", f"{latest['temperature']} °C"],

            ["Stress Level", str(latest["stress_level"])],

            ["Sleep Duration", f"{latest['sleep_hours']} hours"],

            ["Radiation Level", str(latest["radiation_level"])],

            ["Bone Density", str(latest["bone_density"])],

            ["Bone Loss Risk", str(latest["bone_loss_risk"])],

            ["Muscle Strength", str(latest["muscle_strength"])],

            ["Muscle Mass", str(latest["muscle_mass"])],

            ["Exercise Duration", f"{latest['exercise_minutes']} minutes"],

            ["White Blood Cell Count", str(latest["wbc_count"])],

            ["Inflammation Level", str(latest["inflammation_level"])]

        ]

        health_table = Table(
            health_parameters,
            colWidths=[75 * mm, 75 * mm]
        )

        health_table.setStyle(TableStyle([

            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#176B87")),

            ("TEXTCOLOR", (0, 0), (-1, 0),
             colors.white),

            ("FONTNAME", (0, 0), (-1, 0),
             "Helvetica-Bold"),

            ("FONTSIZE", (0, 0), (-1, -1), 9),

            ("GRID", (0, 0), (-1, -1), 0.5,
             colors.HexColor("#D5DEE8")),

            ("BACKGROUND", (0, 1), (-1, -1),
             colors.HexColor("#F4F8FB")),

            ("PADDING", (0, 0), (-1, -1), 8),

            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")

        ]))

        story.append(health_table)

    # AI ANALYSIS REPORT

    if report_type == "ai":

        story.append(
            Paragraph(
                "AI Health Analysis",
                heading_style
            )
        )

        readings = {

            "heart_rate": latest["heart_rate"],
            "spo2": latest["spo2"],
            "temperature": latest["temperature"],
            "blood_pressure": latest["blood_pressure"],
            "radiation_level": latest["radiation_level"],
            "sleep_hours": latest["sleep_hours"],
            "stress_level": latest["stress_level"],
            "bone_density": latest["bone_density"],
            "bone_loss_risk": latest["bone_loss_risk"],
            "muscle_strength": latest["muscle_strength"],
            "muscle_mass": latest["muscle_mass"],
            "exercise_minutes": latest["exercise_minutes"],
            "wbc_count": latest["wbc_count"],
            "inflammation_level": latest["inflammation_level"]

        }

        analysis = analyze_health(readings)

        ai_rows = [

            ["AI Analysis Parameter", "Result"],

            ["Health Status", str(analysis.get("status", "N/A"))],

            ["AI Result", str(analysis.get("ai_result", "N/A"))],

            ["Anomaly Score", str(analysis.get("anomaly_score", "N/A"))],

            ["Interpretation", str(
                analysis.get("anomaly_interpretation", "N/A")
            )],

            ["Alerts", "; ".join(
                map(str, analysis.get("alerts", []))
            ) or "No alerts"],

            ["Recommendations", "; ".join(
                map(str, analysis.get("recommendations", []))
            ) or "No recommendations"]

        ]

        ai_table_data = []

        for index, row in enumerate(ai_rows):

            if index == 0:
                ai_table_data.append(row)

            else:

                ai_table_data.append([

                    Paragraph(str(row[0]), normal_style),

                    Paragraph(str(row[1]), normal_style)

                ])

        ai_table = Table(
            ai_table_data,
            colWidths=[55 * mm, 105 * mm]
        )

        ai_table.setStyle(TableStyle([

            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#176B87")),

            ("TEXTCOLOR", (0, 0), (-1, 0),
             colors.white),

            ("FONTNAME", (0, 0), (-1, 0),
             "Helvetica-Bold"),

            ("FONTSIZE", (0, 0), (-1, -1), 8),

            ("GRID", (0, 0), (-1, -1), 0.5,
             colors.HexColor("#D5DEE8")),

            ("BACKGROUND", (0, 1), (-1, -1),
             colors.HexColor("#F4F8FB")),

            ("PADDING", (0, 0), (-1, -1), 8),

            ("VALIGN", (0, 0), (-1, -1), "TOP")

        ]))

        story.append(ai_table)

    # COMPLETE HEALTH HISTORY

    if report_type == "history":

        story.append(
            Paragraph(
                "Complete Astronaut Health History",
                heading_style
            )
        )

        headers = [

            "Date",
            "Heart Rate",
            "Blood Pressure",
            "SpO2",
            "Temp",
            "Stress",
            "Sleep",
            "Radiation",
            "Bone Density",
            "Bone Risk",
            "Muscle Strength",
            "Muscle Mass",
            "Exercise",
            "WBC",
            "Inflammation"

        ]

        history_data = [headers]

        for record in records:

            history_data.append([

                Paragraph(
                    str(record["recorded_at"] or "N/A"),
                    small_style
                ),

                str(record["heart_rate"]),
                str(record["blood_pressure"]),
                str(record["spo2"]),
                str(record["temperature"]),
                str(record["stress_level"]),
                str(record["sleep_hours"]),
                str(record["radiation_level"]),
                str(record["bone_density"]),
                str(record["bone_loss_risk"]),
                str(record["muscle_strength"]),
                str(record["muscle_mass"]),
                str(record["exercise_minutes"]),
                str(record["wbc_count"]),
                str(record["inflammation_level"])

            ])

        column_widths = [

            64, 39, 48, 30, 32,
            32, 32, 40, 43, 39,
            48, 42, 40, 32, 45

        ]

        history_table = Table(

            history_data,
            colWidths=column_widths,
            repeatRows=1

        )

        history_table.setStyle(TableStyle([

            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#176B87")),

            ("TEXTCOLOR", (0, 0), (-1, 0),
             colors.white),

            ("FONTNAME", (0, 0), (-1, 0),
             "Helvetica-Bold"),

            ("FONTSIZE", (0, 0), (-1, -1), 5.5),

            ("GRID", (0, 0), (-1, -1), 0.35,
             colors.HexColor("#CBD5E1")),

            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [

                colors.white,
                colors.HexColor("#F0F6FA")

            ]),

            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

            ("LEFTPADDING", (0, 0), (-1, -1), 3),

            ("RIGHTPADDING", (0, 0), (-1, -1), 3),

            ("TOPPADDING", (0, 0), (-1, -1), 5),

            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)

        ]))

        story.append(history_table)

    # DISCLAIMER

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            "<b>DISCLAIMER:</b> This report is generated by "
            "AstroCare AI for educational and simulation purposes only. "
            "It is not a medical diagnosis. Health thresholds and AI "
            "results are illustrative demonstration values.",
            small_style
        )
    )

    # FOOTER

    def add_footer(canvas, doc):

        canvas.saveState()

        canvas.setFont("Helvetica", 8)

        canvas.setFillColor(
            colors.HexColor("#526477")
        )

        canvas.drawString(

            margins,
            8 * mm,
            "AstroCare AI | Astronaut Health Monitoring System"

        )

        canvas.drawRightString(

            page_size[0] - margins,
            8 * mm,
            f"Page {doc.page}"

        )

        canvas.restoreState()

    document.build(
        story,
        onFirstPage=add_footer,
        onLaterPages=add_footer
    )

    buffer.seek(0)

    return buffer


# ==========================================
# DOWNLOAD HEALTH REPORTS
# ==========================================

@app.route(
    "/api/reports/<astronaut_id>/<report_type>",
    methods=["GET"]
)
def download_health_report(astronaut_id, report_type):

    allowed_types = [
        "latest",
        "history",
        "ai"
    ]

    if report_type not in allowed_types:

        return jsonify({
            "error": "Invalid report type"
        }), 400

    try:

        pdf_buffer = generate_health_pdf(
            astronaut_id,
            report_type
        )

        if pdf_buffer is None:

            return jsonify({
                "error": "No health records found"
            }), 404

        filename = (
            f"AstroCare_{astronaut_id}_{report_type}_report.pdf"
        )

        return send_file(

            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename

        )

    except Exception:

        app.logger.exception("PDF report generation failed")

        return jsonify({
            "error": "PDF generation failed"
        }), 500


# ==========================================
# SERVER STARTUP
# ==========================================

if __name__ == "__main__":

    print("\n====================================")

    print("       ASTROCARE AI SERVER")

    print("====================================")

    print("Server: http://127.0.0.1:5001")

    print("Astronaut: ASTRO-001")

    print("Status: Starting...")

    print("====================================\n")

    app.run(

        host="127.0.0.1",
        port=5001,
        debug=True

    )