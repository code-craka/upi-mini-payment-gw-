#!/bin/bash

# Quick Vulnerability Check and Fix Script
# Run this to identify and fix remaining GitHub Dependabot alerts

echo "=================================="
echo "GitHub Dependabot Vulnerability Fix"
echo "=================================="
echo ""

cd /Users/rihan/all-coding-project/UPI_MINI_GATEWAY

echo "📋 Step 1: Checking current package versions..."
echo ""
echo "Frontend packages:"
cd frontend
npm list axios vite react react-dom framer-motion --depth=0 2>/dev/null || echo "Some packages not found"

echo ""
echo "Backend packages:"
cd ../backend
npm list express mongoose jsonwebtoken bcryptjs express-rate-limit --depth=0 2>/dev/null || echo "Some packages not found"

echo ""
echo "=================================="
echo "🔧 Step 2: Attempting automatic fixes..."
echo "=================================="

echo ""
echo "Fixing frontend vulnerabilities..."
cd ../frontend
npm audit fix 2>&1 | tee /tmp/frontend-audit.log

echo ""
echo "Fixing backend vulnerabilities..."  
cd ../backend
npm audit fix 2>&1 | tee /tmp/backend-audit.log

echo ""
echo "=================================="
echo "📊 Step 3: Verification..."
echo "=================================="

cd /Users/rihan/all-coding-project/UPI_MINI_GATEWAY

echo ""
echo "Checking for remaining issues..."
echo "Frontend:"
cd frontend
npm outdated 2>/dev/null || echo "All packages up to date"

echo ""
echo "Backend:"
cd ../backend  
npm outdated 2>/dev/null || echo "All packages up to date"

echo ""
echo "=================================="
echo "✅ Next Steps:"
echo "=================================="
echo ""
echo "1. Review the audit logs:"
echo "   - Frontend: /tmp/frontend-audit.log"
echo "   - Backend: /tmp/backend-audit.log"
echo ""
echo "2. If fixes were applied, commit and push:"
echo "   cd /Users/rihan/all-coding-project/UPI_MINI_GATEWAY"
echo "   git add ."
echo "   git commit -m 'fix: Apply npm audit fixes for remaining vulnerabilities'"
echo "   git push origin main"
echo ""
echo "3. Verify on GitHub:"
echo "   Visit: https://github.com/code-craka/upi-mini-payment-gw-/security/dependabot"
echo ""
echo "4. If vulnerabilities persist:"
echo "   - Read DEPENDABOT_FIX_GUIDE.md for manual steps"
echo "   - Check if Dependabot created PRs you can merge"
echo ""

# Check if there are changes to commit
cd /Users/rihan/all-coding-project/UPI_MINI_GATEWAY
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Uncommitted changes detected!"
    echo ""
    git status -s
    echo ""
    echo "Run the following to commit:"
    echo "  git add ."
    echo "  git commit -m 'fix: Apply npm audit fixes'"
    echo "  git push origin main"
else
    echo "✨ No changes needed - all clean!"
fi
