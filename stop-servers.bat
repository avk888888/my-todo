@echo off
REM ============================================
REM my-todo Server Stopper
REM Stops Backend and Frontend servers
REM ============================================

set "LOG_DIR=C:\Users\USER\projects\my-todo\logs"

echo [%date% %time%] Stopping my-todo servers... >> "%LOG_DIR%\startup.log"

REM Kill uvicorn/backend processes
taskkill /F /IM uvicorn.exe 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq uvicorn*" 2>nul

REM Kill node/vite/frontend processes
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul

echo [%date% %time%] Servers stopped! >> "%LOG_DIR%\startup.log"
echo Servers stopped.
