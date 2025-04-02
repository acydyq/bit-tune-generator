@echo off
:: Compile TypeScript to JavaScript
echo Compiling TypeScript to JavaScript...
tsc -p . --extendedDiagnostics

:: Check if the compilation was successful
if errorlevel 1 (
    echo TypeScript compilation failed!
    exit /b 1
)
echo TypeScript compilation completed successfully!

:: Remove old files in the 'dist' folder
echo Removing old files in 'dist' folder...
rmdir /s /q dist
mkdir dist

:: Bundle and minify output using Parcel (make sure Parcel is installed via npm)
echo Bundling and minifying output using Parcel...
parcel build --target browser --log-level 2 --detailed-report 10 target/tracker.js

:: Check if Parcel build was successful
if errorlevel 1 (
    echo Parcel build failed!
    exit /b 1
)
echo Parcel build completed successfully!

echo Build process completed!
pause
