@echo off
echo ========================================
echo       French B1 - Easy Deploy
echo ========================================
echo.

echo 1. Checking Status...
git status
echo.

set /p confirm="Do you want to proceed with deployment? (Y/N): "
if /i "%confirm%" neq "Y" goto :eof

echo.
echo 2. Adding all files...
git add .

echo.
echo 3. Committing changes...
set /p msg="Enter commit message (Press Enter for 'Update'): "
if "%msg%"=="" set msg=Update

git commit -m "%msg%"

echo.
echo 4. Pushing to GitHub...
git push

echo.
echo ========================================
echo       Deployment Finished!
echo ========================================
pause
