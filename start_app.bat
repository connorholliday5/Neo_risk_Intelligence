@echo off
cd /d C:\Users\cwhol\OneDrive\Desktop\Programming\neo-risk-intelligence
call .venv\Scripts\activate.bat
python -m streamlit run app/app.py
pause
