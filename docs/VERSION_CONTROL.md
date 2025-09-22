# Version Control & Release Management

This document outlines the version control strategy, release management process, and tagging conventions for the UPI Mini Gateway project.

## 📋 Table of Contents

- [Versioning Strategy](#versioning-strategy)
- [Git Workflow](#git-workflow)
- [Release Process](#release-process)
- [Tagging Conventions](#tagging-conventions)
- [Branch Strategy](#branch-strategy)
- [Changelog Management](#changelog-management)
- [Release Automation](#release-automation)

---

## 🏷️ Versioning Strategy

### Semantic Versioning (SemVer)

We follow [Semantic Versioning 2.0.0](https://semver.org/) for all releases:

```
MAJOR.MINOR.PATCH
```

#### Version Components

- **MAJOR** (X.0.0): Breaking changes that require user intervention
- **MINOR** (0.X.0): New features that are backward compatible
- **PATCH** (0.0.X): Bug fixes and security patches

#### Examples

```
1.0.0  - Initial stable release
1.0.1  - Bug fix release
1.1.0  - New feature release (backward compatible)
2.0.0  - Major release with breaking changes
```

### Pre-release Versions

For development and testing phases:

```
1.1.0-alpha.1    - Alpha release
1.1.0-beta.2     - Beta release
1.1.0-rc.1       - Release candidate
```

---

## 🌊 Git Workflow

### Branch Strategy

#### Main Branches

- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for features (if needed)

#### Supporting Branches

- **`feature/*`**: New features and enhancements
- **`hotfix/*`**: Critical fixes for production
- **`release/*`**: Preparation for new releases

#### Branch Naming Conventions

```bash
feature/payment-webhook-integration
feature/multi-language-support
hotfix/security-jwt-vulnerability
release/v1.1.0
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD pipeline changes
- `security`: Security-related changes

#### Examples

```bash
feat(payment): add webhook integration for real-time notifications
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
security(api): implement rate limiting for authentication endpoints
```

---

## 🚀 Release Process

### 1. Pre-Release Preparation

#### Code Preparation
```bash
# Ensure all tests pass
npm run test

# Run security scans
npm audit
npm run lint

# Build and verify
npm run build

# Update dependencies
npm update
```

#### Documentation Updates
- Update CHANGELOG.md with new features and fixes
- Review and update README.md if needed
- Update API documentation
- Review security documentation

### 2. Version Bumping

#### Automatic Version Bump
```bash
# For patch release (1.0.0 -> 1.0.1)
npm version patch

# For minor release (1.0.1 -> 1.1.0)
npm version minor

# For major release (1.1.0 -> 2.0.0)
npm version major
```

#### Manual Version Update
Update version in:
- `frontend/package.json`
- `backend/package.json`
- Environment variables (`VITE_APP_VERSION`)

### 3. Release Creation

#### GitHub Release Process

1. **Create Release Tag**
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

2. **Create GitHub Release**
- Go to GitHub repository
- Click "Releases" → "Create a new release"
- Select the tag version
- Add release title and description
- Attach release assets if needed

3. **Automated Release** (Recommended)
```bash
# Using GitHub CLI
gh release create v1.0.0 \
  --title "UPI Mini Gateway v1.0.0" \
  --notes-file docs/RELEASE_NOTES.md \
  --draft
```

### 4. Post-Release Tasks

#### Deployment
- Deploy to production environments
- Update CDN and caching
- Monitor deployment health
- Verify all services are running

#### Communication
- Announce release on relevant channels
- Update project status pages
- Notify stakeholders and users
- Update documentation sites

---

## 🏷️ Tagging Conventions

### Tag Naming

All tags follow the `v` prefix followed by semantic version:

```bash
v1.0.0      # Stable release
v1.1.0-rc.1 # Release candidate
v1.2.0-beta.1 # Beta release
```

### Tag Types

#### Release Tags
- **Stable Releases**: `v1.0.0`, `v1.1.0`, `v2.0.0`
- **Pre-releases**: `v1.1.0-alpha.1`, `v1.1.0-beta.2`, `v1.1.0-rc.1`

#### Special Tags
- **LTS Releases**: `v1.0.0-lts` (Long Term Support)
- **Security Patches**: `v1.0.1-security`

### Creating Tags

#### Lightweight Tags
```bash
git tag v1.0.0
```

#### Annotated Tags (Recommended)
```bash
git tag -a v1.0.0 -m "Release version 1.0.0

Features:
- Complete UPI payment gateway
- Modern glassmorphism UI
- Enterprise-grade security

Author: Sayem Abdullah Rihan <hello@techsci.io>"
```

#### Signed Tags
```bash
git tag -s v1.0.0 -m "Signed release version 1.0.0"
```

---

## 🌿 Branch Strategy

### Main Branch Protection

The `main` branch is protected with:
- Required pull request reviews
- Required status checks
- Up-to-date branch requirement
- Signed commits enforcement
- Administrator enforcement

### Feature Development Workflow

```bash
# Create feature branch
git checkout -b feature/payment-webhook
git push -u origin feature/payment-webhook

# Development work...
git add .
git commit -m "feat(webhook): implement payment notification system"

# Create pull request
gh pr create --title "Add Payment Webhook Integration" \
  --body "Implements real-time payment notifications via webhooks"

# After review and approval
git checkout main
git pull origin main
git merge --no-ff feature/payment-webhook
git push origin main

# Clean up
git branch -d feature/payment-webhook
git push origin --delete feature/payment-webhook
```

### Hotfix Workflow

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/security-fix

# Apply fix
git add .
git commit -m "security(auth): fix JWT token validation vulnerability"

# Create emergency release
npm version patch  # 1.0.0 -> 1.0.1
git push origin hotfix/security-fix
git tag v1.0.1
git push origin v1.0.1

# Merge to main
git checkout main
git merge --no-ff hotfix/security-fix
git push origin main

# Clean up
git branch -d hotfix/security-fix
git push origin --delete hotfix/security-fix
```

---

## 📝 Changelog Management

### Changelog Format

We use [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [Unreleased]
### Added
- New features coming in next release

## [1.1.0] - 2024-01-15
### Added
- Webhook integration for payment notifications
- Multi-language support (Hindi, English)

### Changed
- Improved payment flow user experience
- Updated dependencies to latest versions

### Fixed
- Resolved JWT token expiration handling
- Fixed mobile responsive design issues

### Security
- Implemented additional rate limiting
- Enhanced input validation
```

### Automated Changelog Generation

Using conventional commits for automatic changelog:

```bash
# Install conventional-changelog-cli
npm install -g conventional-changelog-cli

# Generate changelog
conventional-changelog -p angular -i CHANGELOG.md -s

# Or using release-it
npx release-it
```

---

## 🤖 Release Automation

### GitHub Actions Workflow

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Run tests
        run: |
          cd frontend && npm test
          cd ../backend && npm test

      - name: Build applications
        run: |
          cd frontend && npm run build
          cd ../backend && npm run build

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

### Automated Deployment

```yaml
name: Deploy

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📊 Release Metrics

### Tracking Release Health

#### Key Metrics
- **Release Frequency**: Target monthly minor releases
- **Lead Time**: Time from commit to production
- **Deployment Success Rate**: Target 99%+
- **Rollback Rate**: Target <5%

#### Monitoring Tools
- **Sentry**: Error tracking and performance monitoring
- **GitHub Insights**: Repository analytics
- **Vercel Analytics**: Deployment and runtime metrics

### Release Quality Gates

#### Pre-Release Checks
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scans clean (CodeQL, dependency audit)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated

#### Post-Release Monitoring
- [ ] Deployment successful
- [ ] Health checks passing
- [ ] Error rates within thresholds
- [ ] Performance metrics stable
- [ ] User feedback collected

---

## 🔐 Security Considerations

### Signed Releases

All releases should be cryptographically signed:

```bash
# Setup GPG key
gpg --generate-key

# Configure Git
git config user.signingkey [KEY_ID]
git config commit.gpgsign true
git config tag.gpgsign true

# Create signed tag
git tag -s v1.0.0 -m "Signed release v1.0.0"
```

### Release Assets Security

- All release artifacts are checksummed
- Security signatures provided for verification
- Automated security scanning of release packages

---

## 📚 Resources

### Tools and References

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [release-it](https://github.com/release-it/release-it)

### Project-Specific Scripts

```bash
# Release preparation script
./scripts/prepare-release.sh

# Automated release script
./scripts/create-release.sh

# Post-release verification
./scripts/verify-release.sh
```

---

## 🤝 Contributing

For detailed contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md).

### Quick Reference

1. Fork the repository
2. Create feature branch from `main`
3. Follow commit conventions
4. Submit pull request
5. Address review feedback
6. Merge after approval

---

**Author**: Sayem Abdullah Rihan ([@code-craka](https://github.com/code-craka))
**Email**: [hello@techsci.io](mailto:hello@techsci.io)
**Last Updated**: December 23, 2024