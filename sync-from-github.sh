#!/bin/bash
# GitHub Pull Script for Gemini CLI
# This script pulls the latest changes from the GitHub repository

echo "🔄 Syncing from GitHub repository..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    echo "Please run this script from the repository root directory"
    exit 1
fi

# Check current status
echo "📋 Current status:"
git status --porcelain

# Stash any local changes if they exist
if [[ -n $(git status --porcelain) ]]; then
    echo "💾 Stashing local changes..."
    git stash push -m "Auto-stash before pull $(date)"
fi

# Fetch latest changes
echo "📥 Fetching latest changes from origin..."
git fetch origin

# Pull changes
echo "🔽 Pulling changes from main branch..."
git pull origin main

# Check if pull was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully synced with GitHub!"
    echo "📊 Latest commits:"
    git log --oneline -5
else
    echo "❌ Failed to pull changes"
    echo "Please resolve conflicts manually"
    exit 1
fi

echo "🎉 Sync complete!"