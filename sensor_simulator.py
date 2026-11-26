import time
import random
import json
import urllib.request
from datetime import datetime
# ==========================================
# ASTROCARE AI - MANUAL, CONTINUOUS DEMO SENSOR SIMULATOR
# ==========================================
API_URL = "http://127.0.0.1:5001/api/health"
ASTRONAUT_ID = "ASTRO-001"
# ==========================================
# INITIAL SIMULATED READINGS
# ==========================================
heart_rate = 78.0
spo2 = 98.0
temperature = 36.9
systolic_bp = 118
diastolic_bp = 78
stress_level = 3.0
sleep_hours = 7.5
radiation_level = 0.25
# Additional health parameters
bone_density = 1.15
bone_loss_risk = 8.0
muscle_strength = 85.0
muscle_mass = 42.0
exercise_minutes = 35.0
wbc_count = 6.5
inflammation_level = 1.8
cycle = 0
def generate_readings():
    global heart_rate, spo2, temperature
    global systolic_bp, diastolic_bp
    global stress_level, radiation_level, cycle
    global bone_density, bone_loss_risk
    global muscle_strength, muscle_mass
    global exercise_minutes
    global wbc_count, inflammation_level
    cycle += 1
    # ======================================
    # VITAL SIGN SIMULATION
    # ======================================
    heart_rate += random.uniform(-2, 2)
    spo2 += random.uniform(-0.3, 0.3)
    temperature += random.uniform(-0.05, 0.05)
    systolic_bp += random.randint(-1, 1)
    diastolic_bp += random.randint(-1, 1)
    stress_level += random.uniform(-0.3, 0.3)
    radiation_level += random.uniform(0.0001, 0.001)
    heart_rate = round(max(65, min(95, heart_rate)), 1)
    spo2 = round(max(96, min(99, spo2)), 1)
    temperature = round(max(36.5, min(37.3, temperature)), 2)
    systolic_bp = max(110, min(130, systolic_bp))
    diastolic_bp = max(70, min(85, diastolic_bp))
    stress_level = round(max(1, min(5, stress_level)), 1)
    radiation_level = round(radiation_level, 4)
    # ======================================
    # BONE HEALTH SIMULATION
    # ======================================
    bone_density += random.uniform(-0.0002, 0.0002)
    bone_loss_risk += random.uniform(-0.05, 0.05)
    bone_density = round(max(0.8, min(1.5, bone_density)), 4)
    bone_loss_risk = round(max(1, min(30, bone_loss_risk)), 2)
    # ======================================
    # MUSCLE HEALTH SIMULATION
    # ======================================
    muscle_strength += random.uniform(-0.2, 0.2)
    muscle_mass += random.uniform(-0.05, 0.05)
    muscle_strength = round(max(70, min(100, muscle_strength)), 2)
    muscle_mass = round(max(35, min(50, muscle_mass)), 2)
    # ======================================
    # PHYSICAL ACTIVITY SIMULATION
    # ======================================
    exercise_minutes += random.uniform(-0.3, 0.3)
    exercise_minutes = round(
        max(20, min(60, exercise_minutes)), 1
    )
    # ======================================
    # IMMUNE HEALTH SIMULATION
    # ======================================
    wbc_count += random.uniform(-0.05, 0.05)
    inflammation_level += random.uniform(-0.03, 0.03)
    wbc_count = round(max(4, min(10, wbc_count)), 2)
    inflammation_level = round(
        max(0.5, min(5, inflammation_level)), 2
    )
    # ======================================
    # DEMONSTRATION WARNING EVENT
    # EVERY 60 SECONDS
    # ======================================
    if cycle % 12 in (6, 7):
        heart_rate = 115.0
        spo2 = 93.0
        temperature = 38.0
        systolic_bp = 145
        diastolic_bp = 92
        stress_level = 8.0
    else:
        heart_rate = min(95, max(65, heart_rate))
        spo2 = max(96, min(99, spo2))
        temperature = max(36.5, min(37.3, temperature))
        systolic_bp = max(110, min(130, systolic_bp))
        diastolic_bp = max(70, min(85, diastolic_bp))
        stress_level = max(1, min(5, stress_level))
    # ======================================
    # SEND ALL 14 HEALTH PARAMETERS
    # ======================================
    readings = {
        "astronaut_id": ASTRONAUT_ID,
        "data_source": "demo",
        "heart_rate": heart_rate,
        "spo2": spo2,
        "temperature": temperature,
        "blood_pressure": f"{systolic_bp}/{diastolic_bp}",
        "sleep_hours": sleep_hours,
        "stress_level": stress_level,
        "radiation_msv": radiation_level,
        "bone_density": bone_density,
        "bone_loss_risk": bone_loss_risk,
        "muscle_strength": muscle_strength,
        "muscle_mass": muscle_mass,
        "exercise_minutes": exercise_minutes,
        "wbc_count": wbc_count,
        "inflammation_level": inflammation_level
    }
    return readings
def send_readings(readings):
    data = json.dumps(readings).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        result = json.loads(response.read().decode("utf-8"))
        print("\n========================================")
        print("       ASTROCARE AI LIVE MONITORING")
        print("========================================")
        print("Time:", datetime.now().strftime("%H:%M:%S"))
        print("Astronaut:", ASTRONAUT_ID)
        print("\n--- VITAL SIGNS ---")
        print("Heart Rate:", readings["heart_rate"])
        print("SpO2:", readings["spo2"])
        print("Temperature:", readings["temperature"])
        print("Blood Pressure:", readings["blood_pressure"])
        print("Stress:", readings["stress_level"])
        print("Sleep:", readings["sleep_hours"])
        print("Radiation:", readings["radiation_msv"])
        print("\n--- BONE HEALTH ---")
        print("Bone Density:", readings["bone_density"])
        print("Bone Loss Risk:", readings["bone_loss_risk"])
        print("\n--- MUSCLE HEALTH ---")
        print("Muscle Strength:", readings["muscle_strength"])
        print("Muscle Mass:", readings["muscle_mass"])
        print("\n--- PHYSICAL ACTIVITY ---")
        print("Exercise Minutes:", readings["exercise_minutes"])
        print("\n--- IMMUNE HEALTH ---")
        print("WBC Count:", readings["wbc_count"])
        print("Inflammation:", readings["inflammation_level"])
        print("\nAI Status:", result["analysis"]["status"])
        print("API Status:", response.status)
        print("========================================")
if __name__ == "__main__":
    print("ASTROCARE AI SENSOR SIMULATOR STARTED")
    print("Sending 14 simulated health parameters every 5 seconds...")
    try:
        while True:
            readings = generate_readings()
            try:
                send_readings(readings)
            except Exception as error:
                print("Sensor/API Error:", error)
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nSensor simulation stopped.")
