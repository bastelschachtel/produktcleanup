@echo off
REM GitHub Pull Script for Windows
REM This script pulls the latest changes from the GitHub repository

echo 🔄 Syncing from GitHub repository...

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Error: Not in a git repository
    echo Please run this script from the repository root directory
    pause
    exit /b 1
)

REM Check current status
echo 📋 Current status:
git status --porcelain

REM Stash any local changes if they exist
git status --porcelain | findstr /r /c:"." >nul
if %errorlevel% equ 0 (
    echo 💾 Stashing local changes...
    git stash push -m "Auto-stash before pull %date% %time%"
)

REM Fetch latest changes
echo 📥 Fetching latest changes from origin...
git fetch origin

REM Pull changes
echo 🔽 Pulling changes from main branch...
git pull origin main

REM Check if pull was successful
if %errorlevel% equ 0 (
    echo ✅ Successfully synced with GitHub!
    echo 📊 Latest commits:
    git log --oneline -5
) else (
    echo ❌ Failed to pull changes
    echo Please resolve conflicts manually
    pause
    exit /b 1
)

echo 🎉 Sync complete!
pause