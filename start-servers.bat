@echo off
REM ============================================
REM my-todo Server Starter
REM Starts Backend (FastAPI) and Frontend (Vite Preview)
REM ============================================

set "NODE_ENV=development"
set "ROOT_DIR=C:\Users\USER\projects\my-todo"
set "LOG_DIR=%ROOT_DIR%\logs"
set "PYTHON_DIR=%USERPROFILE%\AppData\Local\hermes\hermes-agent\venv\Scripts"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo [%date% %time%] Starting my-todo servers... >> "%LOG_DIR%\startup.log"

REM Start Backend (FastAPI on port 8000)
echo [%date% %time%] Starting Backend... >> "%LOG_DIR%\startup.log"
cd /d "%ROOT_DIR%\backend"
start "" /B "%PYTHON_DIR%\uvicorn" main:app --host 127.0.0.1 --port 8000 --workers 1 > "%LOG_DIR%\backend.log" 2>&1

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend (Vite Preview on port 5173)
echo [%date% %time%] Starting Frontend... >> "%LOG_DIR%\startup.log"
cd /d "%ROOT_DIR%\frontend"
start "" /B cmd /c "npx.cmd vite preview --port 5173 --host 127.0.0.1 > "%LOG_DIR%\frontend.log" 2>&1"

REM Start Telegram Bot
echo [%date% %time%] Starting Telegram Bot... >> "%LOG_DIR%\startup.log"
cd /d "%ROOT_DIR%\telegram-bot"
start "" /B cmd /c "set BOT_TOKEN=8948657312:AAG9ShGQKpMae8UcZN8lyAQFjpOyR_Ykouo && "%PYTHON_DIR%\python" bot.py > "%LOG_DIR%\telegram-bot.log" 2>&1"

echo [%date% %time%] All servers started! >> "%LOG_DIR%\startup.log"
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Telegram Bot: running
echo API Docs: http://localhost:8000/docs
