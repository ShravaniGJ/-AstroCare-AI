
from analyzer import analyze_health


# ------------------------------------
# TEST 1: NORMAL HEALTH READINGS
# ------------------------------------

normal_readings = {
    "heart_rate": 75,
    "spo2": 98,
    "temperature": 36.8,
    "systolic_bp": 120,
    "sleep_hours": 8,
    "stress_level": 3,
    "radiation_msv": 0.2
}


# ------------------------------------
# TEST 2: UNUSUAL HEALTH READINGS
# ------------------------------------

unusual_readings = {
    "heart_rate": 115,
    "spo2": 91,
    "temperature": 38,
    "systolic_bp": 145,
    "sleep_hours": 4,
    "stress_level": 8,
    "radiation_msv": 0.8
}


# ------------------------------------
# DISPLAY RESULTS
# ------------------------------------

print("\n========== ORION INNOVATORS ==========")

print("\nTEST 1: NORMAL READINGS")

result1 = analyze_health(normal_readings)

for key, value in result1.items():
    print(key, ":", value)


print("\nTEST 2: UNUSUAL READINGS")

result2 = analyze_health(unusual_readings)

for key, value in result2.items():
    print(key, ":", value)


print("\n========== TEST COMPLETED ==========")
