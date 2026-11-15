
from alerts import check_health

sample_data = {
    "heart_rate": 135,
    "spo2": 90,
    "temperature": 39,
    "sleep_hours": 4,
    "stress_level": 9
}

alerts = check_health(sample_data)

print("ASTRONAUT HEALTH ALERTS")

for alert in alerts:
    print("WARNING:", alert)
