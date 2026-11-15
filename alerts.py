
def check_health(data):

    alerts = []

    heart_rate = data.get("heart_rate")
    spo2 = data.get("spo2")
    temperature = data.get("temperature")
    sleep_hours = data.get("sleep_hours")
    stress_level = data.get("stress_level")

    if heart_rate is not None and heart_rate > 120:
        alerts.append("High heart rate detected")

    if spo2 is not None and spo2 < 94:
        alerts.append("Low oxygen saturation detected")

    if temperature is not None and temperature > 38:
        alerts.append("Elevated body temperature detected")

    if sleep_hours is not None and sleep_hours < 5:
        alerts.append("Insufficient sleep detected")

    if stress_level is not None and stress_level > 8:
        alerts.append("High stress level detected")

    return alerts
