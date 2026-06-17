import subprocess
import os

schtasks = r"C:\Windows\System32\schtasks.exe"
task_path = r"C:\Users\USER\projects\my-todo\start-servers.bat"

# Verify schtasks exists
if not os.path.exists(schtasks):
    print(f"ERROR: {schtasks} not found!")
    exit(1)

# Create the scheduled task
result = subprocess.run(
    [schtasks, '/CREATE', '/SC', 'ONSTART', '/TN', 'my-todo-servers',
     '/TR', task_path, '/RL', 'HIGHEST', '/F'],
    capture_output=True, text=True, shell=True
)
print('CREATE stdout:', result.stdout)
print('CREATE stderr:', result.stderr)
print('CREATE returncode:', result.returncode)

if result.returncode == 0:
    # Run the task immediately
    result = subprocess.run(
        [schtasks, '/RUN', '/TN', 'my-todo-servers'],
        capture_output=True, text=True, shell=True
    )
    print('RUN stdout:', result.stdout)
    print('RUN stderr:', result.stderr)
    print('RUN returncode:', result.returncode)
