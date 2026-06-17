@echo off
schtasks /CREATE /SC ONSTART /TN my-todo-servers /TR "C:\Users\USER\projects\my-todo\start-servers.bat" /RL HIGHEST /F > C:\Users\USER\projects\my-todo\logs\install-result.txt 2>&1
schtasks /RUN /TN my-todo-servers >> C:\Users\USER\projects\my-todo\logs\install-result.txt 2>&1
