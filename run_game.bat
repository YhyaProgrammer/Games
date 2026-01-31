@echo off
echo Installing dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo Pip install failed. Attempting to run anyway (in case libraries are installed globally)...
)
echo.
echo Starting Chess...
python main.py
if %errorlevel% neq 0 (
    echo.
    echo Game crashed or python not found. Please ensure Python 3 is installed and added to PATH.
    pause
)
