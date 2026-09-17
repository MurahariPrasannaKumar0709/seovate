@echo off
REM Starts the backend (FastAPI) and frontend (Next.js) dev servers in separate windows.

set ROOT=%~dp0

start "Seovate Backend" cmd /k "cd /d "%ROOT%backend" && call venv\Scripts\activate.bat && uvicorn app.main:app --reload"

start "Seovate Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo Backend and frontend servers are starting in separate windows...
