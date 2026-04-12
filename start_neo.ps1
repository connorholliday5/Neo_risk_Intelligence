$projectPath = "C:\Users\cwhol\OneDrive\Desktop\Programming\neo-risk-intelligence"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$projectPath`"; .\.venv\Scripts\Activate.ps1; uvicorn api.main:app --port 8000" -WindowStyle Minimized
Start-Sleep -Seconds 4
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$projectPath\frontend`"; npm run dev" -WindowStyle Minimized
