@echo off
:: Ask for the GitHub repository name
set /p REPO_NAME=Enter the name of your GitHub repository: 

:: Ask for the commit message
set /p COMMIT_MESSAGE=Enter your commit message: 

:: Initialize git repo
git init

:: Add all files
git add .

:: Commit files
git commit -m "%COMMIT_MESSAGE%"

:: Build and compile the TypeScript project using the new .bat build process
if exist typescript_compiler.bat (
    echo Attempting to build the project using typescript_compiler.bat...
    call typescript_compiler.bat
) else (
    echo Build script not found. Skipping build process.
)

:: Check if the repository already exists on GitHub
gh repo view acydyq/%REPO_NAME% >nul 2>nul
if errorlevel 1 (
    echo Creating a new repository on GitHub...
    gh repo create "%REPO_NAME%" --public
) else (
    echo Repository already exists on GitHub. Proceeding with push...
)

:: Ensure 'origin' is correctly set
git remote remove origin 2>nul
git remote add origin https://github.com/acydyq/%REPO_NAME%.git

:: Push to GitHub
git branch -M main
git push -u origin main

echo.
echo Repository successfully created and pushed to GitHub!
pause
