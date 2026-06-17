@echo off
REM ============================================
REM Install my-todo as a Windows scheduled task
REM Runs at system startup
REM ============================================

echo Installing my-todo startup task...

schtasks /CREATE /SC ONSTART /TN "my-todo-servers" /TR "C:\Users\USER\projects\my-todo\start-servers.bat" /RL HIGHEST /F

if %ERRORLEVEL% EQU 0 (
    echo Task created successfully!
    echo.
    echo Starting task now...
    schtasks /RUN /TN "my-todo-servers"
) else (
    echo Failed to create task. Try running as Administrator.
)

pause
