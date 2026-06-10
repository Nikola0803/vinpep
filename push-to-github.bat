@echo off
cd /d "%~dp0"
echo Adding all changes...
git add .
echo Committing...
git commit -m "Add coming soon page as first and only active route"
echo Pushing to GitHub...
git push
echo.
echo Done! Press any key to close.
pause
