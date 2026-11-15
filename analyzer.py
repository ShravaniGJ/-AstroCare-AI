import numpy as np
import pandas as pd
from numbers import Real
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
# ==========================================
# 1. SIMULATED NORMAL TRAINING DATA
# ==========================================
def create_training_data():
    np.random.seed(42)
    data = pd.DataFrame({
        "heart_rate": np.random.normal(75, 8, 500),
        "spo2": np.random.normal(98, 1, 500),
        "temperature": np.random.normal(36.8, 0.3, 500),
        "systolic_bp": np.random.normal(120, 8, 500),
        "sleep_hours": np.random.normal(7.5, 0.8, 500),
        "stress_level": np.random.normal(3, 1, 500),
        "radiation_msv": np.random.normal(0.2, 0.08, 500)
    })
    data["spo2"] = data["spo2"].clip(90, 100)
    data["sleep_hours"] = data["sleep_hours"].clip(3, 12)
    data["stress_level"] = data["stress_level"].clip(1, 10)
    data["radiation_msv"] = data["radiation_msv"].clip(0.01, 1)
    return data
# ==========================================
# 2. MODEL CONFIGURATION
# ==========================================
TRAINING_DATA = create_training_data()
MODEL_FIELDS = [
    "heart_rate",
    "spo2",
    "temperature",
    "systolic_bp",
    "sleep_hours",
    "stress_level",
    "radiation_msv"
]
MODEL_DEFAULTS = (
    TRAINING_DATA[MODEL_FIELDS]
    .median()
    .to_dict()
)
def train_model():
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("isolation_forest", IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100
        ))
    ])
    model.fit(TRAINING_DATA[MODEL_FIELDS])
    return model
MODEL = train_model()
# ==========================================
# 3. REQUIRED AND OPTIONAL FIELDS
# ==========================================
REQUIRED_FIELDS = [
    "heart_rate",
    "spo2",
    "temperature",
    "systolic_bp",
    "radiation_msv"
]
OPTIONAL_FIELDS = [
    "sleep_hours",
    "stress_level",
    "bone_density",
    "bone_loss_risk",
    "muscle_strength",
    "muscle_mass",
    "exercise_minutes",
    "wbc_count",
    "inflammation_level"
]
# ==========================================
# 4. INPUT FIELD COMPATIBILITY
# ==========================================
def normalize_readings(readings):
    if not isinstance(readings, dict):
        raise ValueError(
            "Health readings must be provided as a dictionary."
        )
    readings = readings.copy()
    # Support database blood pressure format:
    # Example: 129/85
    if readings.get("systolic_bp") is None:
        blood_pressure = readings.get("blood_pressure")
        if blood_pressure is not None:
            try:
                readings["systolic_bp"] = float(
                    str(blood_pressure).split("/")[0]
                )
            except (ValueError, TypeError):
                raise ValueError(
                    "Invalid blood pressure format."
                )
    # Support database radiation_level field
    if readings.get("radiation_msv") is None:
        if readings.get("radiation_level") is not None:
            readings["radiation_msv"] = readings["radiation_level"]
    return readings
# ==========================================
# 5. INPUT VALIDATION
# ==========================================
def validate_readings(readings):
    readings = normalize_readings(readings)
    limits = {
        "heart_rate": (30, 220),
        "spo2": (50, 100),
        "temperature": (30, 43),
        "systolic_bp": (50, 250),
        "sleep_hours": (0, 24),
        "stress_level": (0, 10),
        "radiation_msv": (0, 100),
        "bone_density": (0, 5),
        "bone_loss_risk": (0, 100),
        "muscle_strength": (0, 1000),
        "muscle_mass": (0, 500),
        "exercise_minutes": (0, 1440),
        "wbc_count": (0, 100),
        "inflammation_level": (0, 100)
    }
    # CHECK REQUIRED FIELDS
    for field in REQUIRED_FIELDS:
        if field not in readings or readings[field] is None:
            raise ValueError(
                "Required reading missing: " + field
            )
    # VALIDATE SUPPLIED VALUES
    for field in REQUIRED_FIELDS + OPTIONAL_FIELDS:
        value = readings.get(field)
        # Optional missing values are allowed
        if value is None:
            continue
        # Reject boolean and non-numeric values
        if isinstance(value, (bool, np.bool_)) or not isinstance(
            value, (Real, np.number)
        ):
            raise ValueError(
                "Invalid numeric reading: " + field
            )
        # Reject NaN and infinity
        if not np.isfinite(value):
            raise ValueError(
                "Non-finite reading: " + field
            )
        low, high = limits[field]
        if not low <= value <= high:
            raise ValueError(
                "Reading outside demo input limits: " + field
            )
    return readings
# ==========================================
# 6. GENERATE HEALTH ALERTS
# ==========================================
def generate_alerts(readings):
    alerts = []
    # VITAL SIGNS
    if readings["heart_rate"] > 100:
        alerts.append(
            "Unusual heart rate reading"
        )
    if readings["spo2"] < 95:
        alerts.append(
            "Low oxygen saturation reading"
        )
    if readings["temperature"] > 37.5:
        alerts.append(
            "Elevated temperature reading"
        )
    if readings["systolic_bp"] > 140:
        alerts.append(
            "Elevated blood pressure reading"
        )
    # SLEEP
    sleep = readings.get("sleep_hours")
    if sleep is not None and sleep < 6:
        alerts.append(
            "Low sleep duration"
        )
    # MENTAL HEALTH
    stress = readings.get("stress_level")
    if stress is not None and stress > 7:
        alerts.append(
            "High stress reading"
        )
    # RADIATION
    if readings["radiation_msv"] > 0.5:
        alerts.append(
            "Radiation exposure needs review"
        )
    # BONE HEALTH
    bone_density = readings.get("bone_density")
    if bone_density is not None and bone_density < 1.0:
        alerts.append(
            "Bone density below demo reference threshold"
        )
    bone_risk = readings.get("bone_loss_risk")
    if bone_risk is not None and bone_risk > 20:
        alerts.append(
            "Elevated bone loss risk score"
        )
    # MUSCLE HEALTH
    muscle_strength = readings.get("muscle_strength")
    if muscle_strength is not None and muscle_strength < 60:
        alerts.append(
            "Low muscle strength score"
        )
    muscle_mass = readings.get("muscle_mass")
    if muscle_mass is not None and muscle_mass < 30:
        alerts.append(
            "Low muscle mass score"
        )
    # PHYSICAL ACTIVITY
    exercise = readings.get("exercise_minutes")
    if exercise is not None and exercise < 20:
        alerts.append(
            "Low physical activity detected"
        )
    # IMMUNE HEALTH
    wbc = readings.get("wbc_count")
    if wbc is not None and (wbc < 4 or wbc > 11):
        alerts.append(
            "WBC count outside demo reference range"
        )
    # INFLAMMATION
    inflammation = readings.get("inflammation_level")
    if inflammation is not None and inflammation > 3:
        alerts.append(
            "Elevated inflammation level"
        )
    return alerts
# ==========================================
# 7. GENERATE RECOMMENDATIONS
# ==========================================
def generate_recommendations(alerts):
    recommendations = []
    if not alerts:
        return [
            "No unusual readings detected in this demo assessment."
        ]
    recommendation_map = {
        "heart rate":
            "Review heart rate trends with the health team.",
        "oxygen":
            "Verify oxygen sensor readings and notify the health team.",
        "temperature":
            "Recheck temperature readings with the health team.",
        "blood pressure":
            "Review blood pressure readings with the health team.",
        "sleep":
            "Review sleep records and rest schedules.",
        "stress":
            "Review stress and wellbeing information with the health team.",
        "radiation":
            "Review radiation monitoring records with mission specialists.",
        "bone density":
            "Review bone density trends with the mission health team.",
        "bone loss":
            "Review bone loss risk trends and exercise records.",
        "muscle strength":
            "Review muscle strength and physical conditioning.",
        "muscle mass":
            "Review muscle mass trends with the mission health team.",
        "physical activity":
            "Review exercise activity and astronaut fitness schedules.",
        "wbc":
            "Verify WBC readings and review laboratory data.",
        "inflammation":
            "Review inflammation trends with the mission health team.",
        "ai detected":
            "Review unusual combinations of health readings with the health team."
    }
    for alert in alerts:
        alert_lower = alert.lower()
        for keyword, recommendation in recommendation_map.items():
            if keyword in alert_lower:
                recommendations.append(recommendation)
                break
    return list(dict.fromkeys(recommendations))
# ==========================================
# 8. COMPLETE AI HEALTH ANALYSIS
# ==========================================
def analyze_health(readings):
    # STEP 1: NORMALIZE AND VALIDATE
    readings = validate_readings(readings)
    # STEP 2: PREPARE MACHINE LEARNING INPUT
    model_values = {}
    missing_optional_fields = []
    for field in MODEL_FIELDS:
        value = readings.get(field)
        if value is None:
            value = MODEL_DEFAULTS[field]
            if field in OPTIONAL_FIELDS:
                missing_optional_fields.append(field)
        model_values[field] = float(value)
    input_data = pd.DataFrame(
        [model_values],
        columns=MODEL_FIELDS
    )
    # STEP 3: MACHINE LEARNING PREDICTION
    prediction = MODEL.predict(input_data)[0]
    anomaly_score = MODEL.decision_function(input_data)[0]
    if prediction == -1:
        ai_result = "Unusual pattern detected"
        anomaly_interpretation = (
            "The Isolation Forest model classified this "
            "combination of readings as unusual."
        )
    else:
        ai_result = "No unusual pattern detected"
        anomaly_interpretation = (
            "The Isolation Forest model did not classify "
            "this combination of readings as unusual."
        )
    # STEP 4: GENERATE HEALTH ALERTS
    alerts = generate_alerts(readings)
    # STEP 5: ADD AI ALERT IF NECESSARY
    if prediction == -1 and not alerts:
        alerts.append(
            "AI detected an unusual combination of health readings."
        )
    # STEP 6: GENERATE RECOMMENDATIONS
    recommendations = generate_recommendations(alerts)
    # STEP 7: DETERMINE HEALTH STATUS
    if alerts:
        status = "WARNING"
    else:
        status = "NORMAL"
    # STEP 8: PREPARE FINAL RESULT
    result = {
        "status": status,
        "ai_result": ai_result,
        "anomaly_score": round(
            float(anomaly_score), 4
        ),
        "anomaly_interpretation": anomaly_interpretation,
        "alerts": alerts,
        "recommendations": recommendations,
        "missing_optional_fields": missing_optional_fields,
        "disclaimer": (
            "Educational simulation only. "
            "Not a medical diagnosis. "
            "Thresholds are illustrative demonstration values."
        )
    }
    return result
# ==========================================
# 9. MODULE TEST
# ==========================================
if __name__ == "__main__":
    test_readings = {
        "heart_rate": 95,
        "spo2": 98,
        "temperature": 36.8,
        "blood_pressure": "129/85",
        "radiation_level": 0.2763,
        "sleep_hours": 7,
        "stress_level": 3,
        "bone_density": None,
        "bone_loss_risk": None,
        "muscle_strength": None,
        "muscle_mass": None,
        "exercise_minutes": None,
        "wbc_count": None,
        "inflammation_level": None
    }
    try:
        result = analyze_health(test_readings)
        print("\n========== ASTROCARE AI ANALYSIS ==========\n")
        for key, value in result.items():
            print(f"{key}: {value}")
        print("\n===========================================\n")
    except ValueError as error:
        print("Validation Error:", error)
    except Exception as error:
        print("Analysis Error:", error)