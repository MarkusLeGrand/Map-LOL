@echo off
echo Starting LeagueHub Analytics Backend...
echo.

cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
