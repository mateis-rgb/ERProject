# L'Entrepôt — Documentation API

Base URL : `http://localhost:3001` (dev) — préfixe `/api` pour toutes les routes ci-dessous, sauf `/health` et `/uploads/*`.

## Conventions

- **Réponse** : `{ "success": true, "data": ... }` ou `{ "success": false, "error": "..." }` (HTTP 400/401/403/404/500).
- **Auth** : cookie de session httpOnly (`connect-pg-simple`, 15 min) + **refresh token** en cookie `refresh_token` (rotation automatique sur 401, `POST /api/auth/refresh`).
- **Rôles** : `ADMIN` > `EDITOR` > `VIEWER`. Les routes annotées EDITOR/ADMIN renvoient `403` sinon.
- **Rate limiting** : 5 tentatives / 15 min sur `POST /api/auth/login` et `/register`.
- **Modules** : si un module est désactivé (config `enabled_modules`), ses routes renvoient `403 { error: "Module désactivé: <id>" }`.
- **Validation** : bodies/queries validés par Zod (`middleware/validation.ts`) → `400` avec message clair.
- **Uploads** : multipart (`multer`), champ `file`, max `MAX_UPLOAD_SIZE`.
- **PDF** : `GET /api/projects/:id/export?mode=complet|previsionnel|definitif`.

## Santé

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | `{ status: "ok", https, timestamp }` |
| GET | `/uploads/<path>` | fichiers du drive (dossier effectif, voir `storage_path`) |

## Auth — `/api/auth`

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/register` | public (limité) | crée un compte (rôle VIEWER par défaut) |
| POST | `/login` | public (limité 5/15min) | login → cookies session + refresh |
| POST | `/logout` | auth | révoque les refresh tokens, clear cookies |
| GET | `/me` | auth | profil courant |
| PATCH | `/me` | auth | change nom / mot de passe (`{ name?, currentPassword?, newPassword? }`) |
| GET | `/users` | auth | liste id+name+email (sélecteurs) |
| PATCH | `/users/:id/role` | ADMIN | change le rôle |
| POST | `/refresh` | cookie refresh | rotation du refresh token |
| POST | `/revoke-all` | auth | révoque tous les refresh tokens de l'utilisateur |

## Admin — `/api/admin` (ADMIN)

| Méthode | Route | Description |
|---|---|---|
| GET | `/users` | liste complète des utilisateurs |
| POST | `/users` | crée un utilisateur `{ email, password, name, role }` |
| PATCH | `/users/:id` | modifie un utilisateur |
| DELETE | `/users/:id` | supprime (sauf soi-même) |
| GET | `/audit` | journal d'audit des actions admin |
| GET | `/status` | version, uptime, stockage, modules actifs, compteurs |
| GET | `/logs?limit=300` | logs applicatifs en mémoire (500 max, depuis le dernier boot) |

## Projets — `/api/projects`

| Méthode | Route | Rôle/Module | Description |
|---|---|---|---|
| GET | `/` | auth | liste, query `?search=&status=&type=&limit=` |
| GET | `/stats` | auth | compteurs pour le dashboard |
| POST | `/` | EDITOR | crée (`templateId` optionnel applique un modèle) |
| GET | `/:id` | auth | détail |
| PATCH | `/:id` | EDITOR | modifie (nom, description, statut, dates, budget, tags, collaborateurs…) |
| DELETE | `/:id` | ADMIN | supprime |
| GET | `/:id/export?mode=` | module `export_pdf` | export PDF néo-brutaliste |
| GET | `/:id/collaborators` | auth | collaborateurs du projet |
| GET/POST/DELETE | `/:id/stock[/:stockItemId]` | EDITOR (écriture) | stock engagé sur le projet |
| GET/POST | `/:id/time` | EDITOR (écriture) | temps passé |
| GET | `/:id/activity` | auth | journal d'activité du projet |

## Jalons (Gantt) — `/api` (module `gantt`, préfixes `/projects`, `/milestones`, `/stock`)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/projects/:projectId/milestones` | auth | jalons du projet (avec `parentId` pour les sous-jalons) |
| POST | `/projects/:projectId/milestones` | EDITOR | crée un jalon |
| PATCH | `/milestones/:id` | EDITOR | modifie (titre, desc, dates, parentId, couleur) |
| DELETE | `/milestones/:id` | EDITOR | supprime |
| GET/POST/DELETE | `/milestones/:id/stock[/:stockItemId]` | EDITOR (écriture) | stock réservé sur un jalon |
| GET | `/stock/:stockItemId/availability` | auth | disponibilités d'un article (conflits projets/jalons) |

## Stock — `/api/stock` (module `stock`)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/?limit=&search=&lowStock=` | auth | inventaire |
| GET | `/low-stock` | auth | articles sous le seuil |
| GET | `/value` | auth | valeur totale du stock |
| GET | `/export/csv` · `/export/json` | auth | exports |
| POST | `/` | EDITOR | crée un article |
| GET/PATCH/DELETE | `/:id` | EDITOR/ADMIN | détail / modif / suppression |
| GET | `/movements/list` | auth | mouvements (filtres query) |
| POST | `/movements` | EDITOR | entrée/sortie/retour `{ stockItemId, type, quantity, reason?, projectId? }` |

## Drive (pièces jointes) — `/api/attachments` (module `drive`)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/project/:projectId` | auth | arborescence (dossiers + fichiers) |
| GET | `/project/:projectId/usage` | auth | usage disque du projet (quota) |
| POST | `/project/:projectId` | EDITOR | upload multipart `file` (+ `parentId`) |
| PATCH | `/:id` | EDITOR | renomme / déplace (`parentId`) |
| GET | `/download/:id` | auth | télécharge un fichier |
| DELETE | `/:id` | EDITOR | supprime (dossier = cascade bornée) |

## Modèles de projet — `/api/templates` (module `templates`)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/` · `/:id` | auth | liste / détail (jalons, dossiers, collaborateurs préfaits) |
| POST | `/` | EDITOR | crée |
| PATCH | `/:id` | EDITOR | modifie |
| DELETE | `/:id` | ADMIN | supprime |
| POST | `/:id/apply` | EDITOR | applique le modèle à un projet (`{ projectId }`) |

## Divers — `/api` (featureRouter + miscRouter)

| Méthode | Route | Rôle/Module | Description |
|---|---|---|---|
| GET | `/users` | auth | id+name+email+role (sélecteurs) |
| GET | `/dashboard` | auth | KPIs |
| GET | `/activity?projectId=` | auth | journal d'activité global |
| GET | `/search?q=` | auth | recherche globale (projets, stock si module actif, users si ADMIN) |
| GET | `/config` · `/config/:key` | auth | lecture config (listes, modules, storage_path, update_repo) |
| PUT | `/config/:key` | ADMIN | écrit une config (`{ values: string[] }`) — `storage_path` rechargé à chaud |
| GET | `/config-keys` | auth | clés de config connues |
| GET | `/storage` | ADMIN | `{ configured, effective, default }` du stockage |
| POST | `/storage/migrate` | ADMIN | migre les fichiers vers `{ to }` (tâche en fond, progression via notification) |
| GET | `/update/check?force=true` | ADMIN | check releases GitHub vs version locale (cache 10 min) |
| GET | `/update/repo?force=true` | ADMIN | vérifie le dépôt `update_repo` (existe, branche par défaut) |

## Notifications — `/api/notifications` (module `notifications`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/?unread=true` | liste + `unreadCount` |
| POST | `/` | crée une notif pour soi (`{ type, title, message?, link?, progress? }`) |
| POST | `/:id/read` · `/read-all` | marque lue(s) |
| PATCH | `/:id` | met à jour la progression `{ progress: 0..100 }` |
| DELETE | `/:id` | supprime une notif (owner) |
| DELETE | `/` | supprime tout — **exige `?all=true`** |

Les notifications sont aussi poussées en **WebSocket** (événement `notification`) sur le canal `user:<id>`.

## Codes d'erreur usuels

| Code | Cas |
|---|---|
| 400 | validation Zod, assertion métier, `?all=true` manquant |
| 401 | non authentifié / session expirée (le front tente un refresh automatique) |
| 403 | rôle insuffisant, ou module désactivé |
| 404 | ressource introuvable |
| 413 | upload trop gros |
| 429 | rate limit login |
| 500 | erreur interne (loguée, voir `/api/admin/logs`) |
