# ERProjects — Client API (frontend)

Tout passe par `src/services/api.ts` :

```ts
api.get<T>(url) | api.post<T>(url, body) | api.put<T>(url, body)
api.patch<T>(url, body) | api.delete<T>(url)
// → ApiResult<T> = { success: true, data: T } | { success: false, error: string }
// cookies httpOnly automatiques ; sur 401, refresh auto puis retry une fois
```

La doc serveur complète est dans `backend/docs/API.md`. Endpoints appelés par le front :

| Méthode | Endpoint | Où |
|---|---|---|
| POST | `/api/auth/login` · `/logout` · `/revoke-all` | LoginForm, TopBar |
| GET/PATCH | `/api/auth/me` | AppContext, SecurityTab |
| GET | `/api/users` | sélecteurs collaborateurs |
| GET | `/api/admin/users` · POST/PATCH/DELETE `/api/admin/users/:id` | AccessTab |
| GET | `/api/admin/audit` · `/status` · `/logs?limit=300` | AuditLog, StatusTab |
| GET | `/api/dashboard` | Dashboard |
| GET | `/api/projects?limit=200` · `/stats` | Projects |
| POST | `/api/projects` | ProjectForm (avec `templateId` optionnel) |
| GET/PATCH/DELETE | `/api/projects/:id` | ProjectDetail, ProjectSettingsTab, ProjectDangerZone |
| GET | `/api/projects/:id/export?mode=` | ProjectExport (bouton, module `export_pdf`) |
| GET | `/api/projects/:id/collaborators` · `/activity` · `/stock` · `/time` · `/milestones` | ProjectDetail |
| POST/DELETE | `/api/projects/:id/stock[/:sid]` · `/time` · `/milestones` | onglets projet |
| PATCH/DELETE | `/api/milestones/:id` · POST/DELETE `/api/milestones/:id/stock/:sid` | Planning/Gantt |
| GET | `/api/stock?limit=500&search=&lowStock=` · `/low-stock` · `/value` · `/export/csv|json` | Stock |
| POST/PATCH/DELETE | `/api/stock` · `/:id` · `/movements` · `/movements/list` | Stock, MovementForm |
| GET | `/api/attachments/project/:pid` · `/usage` · `/download/:id` | DriveTab |
| POST | `/api/attachments/project/:pid` (multipart) · `/folder` | DriveToolbar |
| PATCH/DELETE | `/api/attachments/:id` | DriveRow |
| GET | `/api/templates` · `/:id` · POST/PATCH/DELETE · `/:id/apply` | TemplatesTab, TemplateCard, ProjectForm |
| GET | `/api/config` · `/config/:key` · `/config-keys` | ConfigLists, ModulesTab, AppTab |
| PUT | `/api/config/:key` (ADMIN) | ModulesTab, ConfigLists, StorageSection, RepoModal |
| GET | `/api/storage` · POST `/api/storage/migrate` | StorageSection (admin) |
| GET | `/api/update/check?force=true` · `/api/update/repo` | UpdateSection (admin) |
| GET | `/api/notifications` · POST `/` · `/:id/read` · `/read-all` · PATCH `/:id` · DELETE `/:id` · DELETE `/?all=true` | NotificationContext, bell, StorageSection |
| GET | `/api/search?q=` | CommandPalette (⌘K) |
