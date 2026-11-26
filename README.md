# AstroCare AI

An educational astronaut-health monitoring simulation built with Flask.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5001`. Health records are stored in `astronaut.db`.

## Deploy on Render

Render web services use an ephemeral filesystem by default. That means a SQLite
database stored beside the app can be reset after a restart or deploy. For
persistent SQLite storage, use a paid web-service plan, attach a disk mounted
at `/var/data`, and set `ASTROCARE_DATA_DIR=/var/data` in the service's
environment. Free web services do not support persistent disks. A Render
Postgres database is another option; Render's free Postgres databases expire
after 30 days, so they are suitable for short demos rather than long-term
storage.

The Render health check uses `/api/health/status`. Gunicorn binds to Render's
provided `PORT` environment variable.

To publish code changes, commit this project to the Git repository connected
to the Render service; Render will build and deploy that revision. Do not
commit local `.db` files or `.venv` directories.

## Demo data

The dashboard does not create records automatically. Use **Add demo reading**
to save one clearly labeled synthetic sample, or enter a reading yourself.
These values are for an educational simulation and are not medical advice or
real astronaut telemetry.

`sensor_simulator.py` is a separate opt-in local tool that intentionally sends
synthetic readings every five seconds while it is running. Stop it with
Ctrl+C. It is not started by the Render web service.
