# Docker — documentation de déploiement

## Fichiers

- `docker-compose.yml` (racine) : orchestration `db` + `backend` + `frontend`
- `backend/Dockerfile` : image Node, `prisma migrate deploy` au démarrage, `dist/` servi par `node`
- `frontend/Dockerfile` : build Vite multi-stage, Nginx sert `dist/` et proxy `/api` + `/socket.io` vers `backend:3001`
- `.env` (racine, non commité) : `DB_PASSWORD`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_PASSWORD`… (voir `.env.example`)

## Variables d'environnement importantes

| Variable | Service | Rôle |
|---|---|---|
| `DATABASE_URL` | backend | `postgresql://erProjects:$DB_PASSWORD@db:5432/erProjects` |
| `SESSION_SECRET` | backend | secret de session (≥ 16 caractères) |
| `UPLOAD_DIR` | backend | `/app/uploads` (volume `erProjects_uploads`) — remplaçable à chaud via `storage_path` |
| `MAX_UPLOAD_SIZE` | backend | octets (défaut 50 Mo) |
| `BACKUP_DIR` / `BACKUP_HOUR` | backend | backups pg_dump dans le volume `erProjects_backups` |
| `HTTPS` / `SSL_KEY_PATH` / `SSL_CERT_PATH` | backend | TLS (certs générés par `scripts/setup-https.sh`, à monter en volume) |

## Commandes usuelles

```bash
docker compose up -d --build     # build + démarrage
docker compose ps                # état
docker compose logs -f backend   # logs API
docker compose down              # arrêt (volumes conservés)
docker compose down -v           # arrêt + suppression des volumes (⚠ données)
```

## Dev vs prod

- **dev** : `npm run dev` dans `backend/` et `frontend/` (Vite proxy `/api` → `:3001`), base PostgreSQL locale ou `docker compose up -d db`.
- **prod** : `docker compose up -d --build`. Les mises à jour se font par `docker compose pull && docker compose up -d` (voir Réglages → À propos dans l'app).

## Stockage des fichiers

Par défaut dans le volume `erProjects_uploads` (`/app/uploads`). Un admin peut changer le dossier à chaud (Réglages → Application → Stockage) ; la migration des fichiers existants se fait via le modal dédié (copie bornée + notification de progression).
