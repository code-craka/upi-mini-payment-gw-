#!/bin/bash

# Security Fixes Commit Script

cd /Users/rihan/all-coding-project/UPI_MINI_GATEWAY

echo "Adding all changes..."
git add .

echo "Committing security fixes..."
git commit -m "security: Fix critical vulnerabilities

**Dependency Updates:**
- Update axios to fix DoS vulnerability (High)
- Update vite to fix file serving vulnerabilities (Low)

**Security Enhancements:**
- Add express-mongo-sanitize to prevent NoSQL injection
- Add rate limiting to authentication endpoints
- Add JSON payload size limits to prevent DoS
- Fix logger format string vulnerabilities

**Rate Limiting:**
- Auth endpoints: 5 requests/15min (brute force protection)
- Order creation: 50 requests/hour
- User management: 30 requests/15min
- API general: 100 requests/15min

Fixes: CodeQL warnings #67-#81 and Dependabot alerts #1-#4"

echo "Pushing to main branch..."
git push origin main

echo "Done! Security fixes committed and pushed."
