#!/bin/bash

# Git Push Script for Yoga Studio Development
# Easy way to commit and push changes during development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Yoga Studio Git Push Workflow${NC}"
echo "================================="

# Check if there are any changes
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes detected${NC}"
    exit 0
fi

# Show status
echo -e "${BLUE}📊 Current Status:${NC}"
git status --short

# Get commit message
if [ -z "$1" ]; then
    echo -e "${YELLOW}💬 Enter commit message (or press Enter for auto-generated):${NC}"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Development update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
else
    COMMIT_MSG="$1"
fi

echo -e "${BLUE}📝 Commit Message:${NC} $COMMIT_MSG"

# Add all changes
echo -e "${BLUE}📦 Staging changes...${NC}"
git add .

# Commit changes
echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
echo -e "${BLUE}🌐 Pushing to GitHub...${NC}"
if git push; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}🔗 Repository: https://github.com/sriramanathanhu/yoga-studio${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo -e "${YELLOW}📋 Make sure you've added the SSH key to GitHub:${NC}"
    echo "1. Copy this SSH key:"
    echo "$(cat ~/.ssh/id_ed25519.pub)"
    echo ""
    echo "2. Go to: https://github.com/settings/ssh/new"
    echo "3. Paste the key and save"
    exit 1
fi

echo -e "${GREEN}🎉 Development workflow complete!${NC}"