# ERProjects — Architecture backend

## Couches

```
index.ts (bootstrap, montage, error handler)
   └── routes/          endpoints REST, délèguent aux services
         └── middleware/  auth (session+refresh), requireRole, validation Zod, requireModule
         └── services/    logique métier + accès Prisma
               └── config/prisma.ts   client singleton
```

- **Pas de logique métier dans les routes** : elles valident (Zod), appellent un service, renvoient `{ success, data }`.
- **Error handler global** (`index.ts`) : toute erreur → JSON 400/500, le process ne tombe jamais (`unhandledRejection` aussi logué).
- Express 4 ne forward pas les rejets async → chaque route async est protégée (try/catch ou error handler en aval).

## Auth & sécurité

- **Session** : `express-session` + store PostgreSQL (`connect-pg-simple`), cookie httpOnly, 15 min, `secure` si HTTPS.
- **Refresh token** : cookie `refresh_token` (path `/api`), rotation à chaque `POST /api/auth/refresh`, révocation par utilisateur (`refreshTokenService`). Le front tente un refresh auto sur 401 (`services/api.ts` côté front).
- **Mots de passe** : bcrypt (10 rounds).
- **Rate limiting** : `express-rate-limit`, 5 tentatives / 15 min sur login/register.
- **CORS** : `origin: true, credentials: true` (self-hosted mono-origine).
- **Rôles** : `requireRole("ADMIN"|"EDITOR")` ; VIEWER = lecture seule.
- **Modules** : `middleware/modules.ts` `requireModule(id)` lit la config `enabled_modules` → `403` si off. Appliqué sur : milestones (gantt, préfixes pathés), attachments (drive), stock, bloc `/notifications`, `GET /projects/:id/export` (export_pdf), templates.
- **Validation** : Zod sur tous les bodies/queries (`middleware/validation.ts`).
- **IDs** : UUID partout (Prisma `@default(uuid())`), jamais d'entiers incrémentaux exposés.

## Services principaux (`src/services/`)

| Service | Rôle |
|---|---|
| `authService` | register/login/users/rôles, bcrypt |
| `refreshTokenService` | émission/rotation/révocation des refresh tokens |
| `projectService` / `stockService` / `milestoneService` / `templateService` | CRUD métier + règles (anti-cycle jalons, réservations stock, application de modèles) |
| `attachmentService` / `storageService` | drive + chemin de stockage configurable (`storage_path`, vide = `UPLOAD_DIR`), migration bornée |
| `notificationService` | notifications + progression des tâches (émission WebSocket) |
| `updateService` | check releases GitHub (cache 10 min, timeout 5 s), vérification du dépôt, notif admins anti-spam |
| `logService` | ring buffer de logs en mémoire (500 entrées) pour `/api/admin/logs` |
| `pdfService` | export PDF néo-brutaliste (pdfkit) incl. mini-Gantt |
| `searchService` | recherche globale (filtre stock si module off) |
| `activityService` | journal d'activité (BDD) + audit admin |
| `backupService` | pg_dump quotidien (`BACKUP_HOUR`) |
| `socketService` | singleton Socket.io, canaux `global` et `user:<id>` |
| `configService` | config clé→valeurs JSON en BDD (listes, modules, storage_path, update_repo) + défauts seedés au boot |

## Base de données

- Prisma, schéma dans `prisma/schema.prisma`.
- Migrations au boot (`runAutoMigrate` → `prisma migrate deploy` en prod), donc appliquées automatiquement à chaque redémarrage (utile pour les mises à jour).
- `pg_dump` quotidien dans `BACKUP_DIR`.

## WebSocket

Socket.io sur le même serveur HTTP(S). À la connexion, le client rejoint `user:<id>` (auth handshake) et `global`. Événements : `notification` (nouvelle notif / progression).

## Règles Power of 10 appliquées

Fonctions < 60 lignes (décomposées), boucles à borne explicite (`utils/power10.ts` : `boundedForEach`), pas de récursion (parcours itératifs à pile), `assert()` sur préconditions, retours vérifiés, pas d'allocation dynamique après init dans les chemins chauds, un seul niveau d'indirection. Le hook `power-of-10:lint` vérifie chaque fichier écrit/modifié.
