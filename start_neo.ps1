$projectPath = "C:\Users\cwhol\OneDrive\Desktop\Programming\neo-risk-intelligence"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned; cd `"$projectPath`"; .\.venv\Scripts\Activate.ps1; uvicorn api.main:app --reload --port 8000" -WindowStyle Minimized
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$projectPath\frontend`"; npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 5
Start-Process "lively" -ErrorAction SilentlyContinue
