# Version Control

## Versioning Policy

UPI Mini Gateway follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — breaking API or architectural changes
- **MINOR** — new features, backward-compatible
- **PATCH** — bug fixes and security patches

---

## Version History

| Version | Date | Type | Summary |
|---|---|---|---|
| 2.1.0 | 2026-03-03 | Minor | Domain migration, 0 vulnerabilities, PayPage redesign, Vercel fixes |
| 2.0.0 | 2024-09-23 | Major | 3-tier RBAC, data isolation, migration tooling |
| 1.0.1 | 2024-10-04 | Patch | Security patches, bug fixes |
| 1.0.0 | 2024-09-21 | Major | Initial release |

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Vercel |
| `development` | Integration branch |
| `feat/*` | Feature development |
| `fix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |

---

## Commit Convention

```
feat:     new feature
fix:      bug fix
docs:     documentation only
security: security fix or vulnerability patch
chore:    tooling, deps, config (no production code change)
```

---

## Release Process

1. All changes merged to `main`
2. Vercel auto-deploys frontend and backend
3. Tag release: `git tag -a v2.1.0 -m "v2.1.0 — Production Hardening"`
4. Update `CHANGELOG.md`, `docs/RELEASE_NOTES.md`, `docs/VERSION_CONTROL.md`
5. Bump version in `frontend/package.json` and `backend/package.json`

---

## Production Endpoints

| Environment | Frontend | Backend API |
|---|---|---|
| Production | https://www.loanpayment.live | https://api.loanpayment.live |
| Local dev | http://localhost:5173 | http://localhost:3000 |
