# Harmony ERP - Rapport d'Audit Complet

**Date**: 2026-03-28
**Scope**: Frontend (apps/web), Backend (apps/api), Traductions (messages/)

---

## STATISTIQUES

| Categorie | Critique | Haute | Moyenne | Basse | Total |
|-----------|----------|-------|---------|-------|-------|
| Backend API | 5 | 2 | 5 | 4 | 16 |
| Frontend Dashboard | 2 | 6 | 4 | 5 | 17 |
| Portail Employe | 1 | 0 | 3 | 1 | 5 |
| Traductions | 0 | 0 | 0 | 0 | 0 |
| **TOTAL** | **8** | **8** | **12** | **10** | **38** |

---

## 1. PROBLEMES CRITIQUES (8)

### CRIT-01: Route ordering - endpoints shadowed by `:id`
- **Fichier**: `apps/api/src/routes/employee.routes.ts` (lignes 33, 61-84)
- **Probleme**: Les routes `/export` et `/import-template` sont definies APRES `/:id`. Express matche "export" comme un `:id`, donc ces endpoints retournent 404.
- **Impact**: Export CSV et template d'import completement casses.
- **Fix**: Deplacer les routes statiques AVANT `/:id`.

### CRIT-02: Cross-tenant data modification - Advantages
- **Fichier**: `apps/api/src/controllers/advantage.controller.ts` (lignes 109-119)
- **Probleme**: `updateAdvantage` utilise `where: { id }` sans verifier le `tenantId`. Un utilisateur du Tenant A peut modifier les avantages du Tenant B.
- **Impact**: Violation d'isolation multi-tenant. Faille de securite majeure.
- **Fix**: Utiliser `where: { id, tenantId }` dans toutes les operations update/delete.

### CRIT-03: Cross-tenant data modification - Departments
- **Fichier**: `apps/api/src/controllers/department.controller.ts` (lignes 92-99)
- **Probleme**: `updateDepartment` ne verifie pas le tenant avant la mise a jour.
- **Impact**: Modification inter-tenant possible.
- **Fix**: Ajouter verification `tenantId` avant update.

### CRIT-04: Missing role middleware on Leave routes
- **Fichier**: `apps/api/src/routes/leave.routes.ts` (lignes 91-99)
- **Probleme**: Les routes GET, POST, PUT, PATCH pour les conges n'ont pas de middleware `requireRole`. Seul `authenticateToken` est applique.
- **Impact**: Si le filtrage service echoue, acces non autorise a toutes les donnees de conge.
- **Fix**: Ajouter `requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE])`.

### CRIT-05: Hardcoded Tenant ID
- **Fichier**: `apps/web/src/app/[locale]/dashboard/employees/[id]/page.tsx` (ligne 41)
- **Probleme**: `headers: { 'X-Tenant-ID': 'tenant1' }` en dur au lieu du tenant reel.
- **Impact**: Ne fonctionne que pour un seul tenant. Casse en multi-tenant.
- **Fix**: Utiliser le tenant du auth store.

### CRIT-06: Leave route `/types` shadowed by `/:id`
- **Fichier**: `apps/api/src/routes/leave.routes.ts` (lignes 105-114)
- **Probleme**: La route `/:id/pdf` est definie apres `/:id` - probleme potentiel de shadowing.
- **Impact**: Generation PDF peut echouer.
- **Fix**: Reordonner les routes.

### CRIT-07: DialogTrigger render prop misuse
- **Fichier**: `apps/web/src/app/[locale]/employee/leaves/page.tsx` (lignes 102-106)
- **Probleme**: Utilisation de `render=` prop sur `DialogTrigger` qui n'est pas supportee par Base-UI.
- **Impact**: Le bouton de dialogue ne s'affiche pas correctement.
- **Fix**: Utiliser `asChild` ou passer des children directement.

### CRIT-08: Inconsistent API response format
- **Fichier**: `apps/api/src/controllers/evaluation.controller.ts` (toutes les reponses)
- **Fichier**: `apps/api/src/controllers/tenant.controller.ts` (ligne 18)
- **Probleme**: Retournent `{ data: ... }` au lieu de `{ success: true, data: ... }`. Le frontend check `.data.success`.
- **Impact**: Le frontend ne recoit jamais les donnees des evaluations/tenants.
- **Fix**: Standardiser toutes les reponses avec `{ success: true, data: ... }`.

---

## 2. PROBLEMES HAUTE PRIORITE (8)

### HIGH-01: Hardcoded French strings (non-traduisibles)
- **Fichier**: `apps/web/src/app/[locale]/dashboard/leaves/page.tsx`
  - Ligne 361: `"Demandes"` en dur
  - Ligne 368: `"Soldes"` en dur
  - Ligne 319: `"Approuver"` en dur
  - Ligne 325: `"Refuser"` en dur
- **Fichier**: `apps/web/src/app/[locale]/dashboard/users/page.tsx`
  - Ligne 499: `"Creer"` en dur
  - Ligne 529: `"Enregistrer"` en dur
  - Ligne 541: Phrase complete en francais en dur
  - Ligne 547: `"Supprimer"` en dur
- **Impact**: L'interface arabe affiche du francais a ces endroits.
- **Fix**: Remplacer par `tc('create')`, `tc('save')`, `t('requests')`, etc.

### HIGH-02: Missing translation keys (~15 cles)
- **Fichier**: `apps/web/src/app/[locale]/dashboard/employees/[id]/page.tsx`
  - `t('employeeLoadError')`, `t('loadErrorGeneric')`, `t('selectTemplateError')`, `t('tempPasswordPrompt')`, `t('invalidPassword')`, `t('accessCreated')`, `t('accessCreateError')`
- **Fichier**: `apps/web/src/app/[locale]/dashboard/employees/[id]/onboarding/page.tsx`
  - `t('badgeDownloaded')`, `t('badgeError')`, `t('contractDownloaded')`, `t('contractError')`
- **Fichier**: `apps/web/src/app/[locale]/dashboard/onboarding/page.tsx`
  - `t('templateNameRequired')`, `t('taskTitleRequired')`
- **Impact**: Affiche les cles brutes au lieu du texte traduit.
- **Fix**: Ajouter toutes les cles dans fr.json et ar.json.

### HIGH-03: Missing null checks on employee names
- **Fichier**: `apps/web/src/app/[locale]/dashboard/directory/page.tsx` (lignes 160-163, 195)
- **Fichier**: `apps/web/src/app/[locale]/employee/profile/page.tsx` (ligne 54)
- **Probleme**: `emp.firstName[0]` et `emp.lastName[0]` sans optional chaining. Crash si le nom est null/undefined.
- **Fix**: Utiliser `emp.firstName?.[0]`.

### HIGH-04: Missing tenant verification in advantage delete
- **Fichier**: `apps/api/src/controllers/advantage.controller.ts` (lignes 142-144)
- **Probleme**: Le delete ne verifie pas le tenant de maniere robuste.
- **Fix**: Utiliser `where: { id, tenantId }`.

### HIGH-05: Non-null assertion on tenant ID
- **Fichiers**: Multiples controllers backend
- **Probleme**: Utilisation de `req.tenant?.id!` (non-null assertion). Si le tenant est undefined, crash runtime.
- **Fix**: Verifier explicitement `if (!tenantId) return res.status(400)` avant utilisation.

### HIGH-06: DataTable hardcoded French strings
- **Fichier**: `apps/web/src/components/DataTable.tsx` (ligne 209, 217)
- **Probleme**: `'Chargement...'` et `'Aucun resultat'` en dur au lieu d'utiliser `texts.loading` / `texts.noResults`.
- **Impact**: Non traduisible.
- **Fix**: Utiliser les props `texts`.

### HIGH-07: Inconsistent tenant parameter passing in employee portal
- **Fichiers**:
  - `employee/payslips/page.tsx` (ligne 51): `?tenant=${tenant}`
  - `employee/attestations/page.tsx` (lignes 49, 68): `?tenant=${tenant}`
  - `employee/documents/page.tsx` (ligne 45): `?tenant=${tenantSubdomain}`
- **Probleme**: Utilise des query params au lieu du header `X-Tenant-Subdomain`. Variable nommee differemment.
- **Impact**: Le backend pourrait ne pas resoudre le tenant pour les downloads PDF.
- **Fix**: Standardiser l'utilisation du header.

### HIGH-08: Missing error handling in Organization page
- **Fichier**: `apps/web/src/app/[locale]/dashboard/organization/page.tsx` (ligne 119)
- **Probleme**: Les erreurs de fetch sont catchees mais aucun message n'est affiche.
- **Fix**: Ajouter `toast.error()` dans le catch.

---

## 3. PROBLEMES MOYENNE PRIORITE (12)

### MED-01: Missing pagination on ALL backend list endpoints
- **Fichiers**: Tous les controllers (getEmployees, getUsers, getLeaves, etc.)
- **Probleme**: Aucune pagination implementee. Fetch tous les enregistrements d'un coup.
- **Impact**: Performance degradee avec beaucoup de donnees.
- **Fix**: Ajouter `page`, `limit`, `skip` query parameters.

### MED-02: Potential race condition on leave balance initialization
- **Fichier**: `apps/api/src/routes/leave.routes.ts` (lignes 61-74)
- **Probleme**: `initializeBalances` peut etre appele plusieurs fois pour le meme employe/annee.
- **Impact**: Doublons de soldes de conge.
- **Fix**: Ajouter une contrainte unique ou un check d'idempotence.

### MED-03: Stale closure in useCallback
- **Fichier**: `apps/web/src/app/[locale]/dashboard/grades/page.tsx` (ligne 68)
- **Fichier**: `apps/web/src/app/[locale]/employee/attestations/page.tsx` (ligne 38)
- **Probleme**: `useCallback` avec deps incompletes (manque `t` function).
- **Impact**: Messages d'erreur potentiellement desynchronises.
- **Fix**: Ajouter `t` aux dependances.

### MED-04: Missing startup validation for env vars
- **Fichier**: `apps/api/src/index.ts`
- **Probleme**: Seuls JWT_SECRET et JWT_REFRESH_SECRET sont valides au demarrage. SMTP, CRON_SECRET ne sont verifies qu'au runtime.
- **Impact**: Erreurs silencieuses quand les emails echouent.
- **Fix**: Valider toutes les variables requises au demarrage.

### MED-05: SUPER_ADMIN JWT contains misleading tenantId
- **Fichier**: `apps/api/src/services/auth.service.ts` (ligne 86)
- **Probleme**: Le JWT du SUPER_ADMIN contient un `tenantId` qui peut etre incorrect.
- **Fix**: Mettre `tenantId: null` pour SUPER_ADMIN.

### MED-06: Missing database indexes
- **Fichier**: `apps/api/prisma/schema.prisma` (ligne 303)
- **Probleme**: `@@unique([tenantId, date])` sur Holiday mais pas d'index pour les requetes par plage de dates.
- **Fix**: Ajouter `@@index([tenantId, date])`.

### MED-07: API response inconsistency across controllers
- **Probleme**: Certains controllers retournent `{ success, data }`, d'autres `{ data }`, d'autres directement les donnees.
- **Impact**: Le frontend doit gerer plusieurs formats.
- **Fix**: Standardiser toutes les reponses.

### MED-08: Payroll page references undefined `departments`
- **Fichier**: `apps/web/src/app/[locale]/dashboard/payroll/page.tsx` (ligne 214)
- **Probleme**: `departments.map(...)` mais `departments` n'est ni fetch ni defini.
- **Impact**: Crash ou liste vide.
- **Fix**: Fetch departments ou supprimer le filtre.

### MED-09: Employee list inconsistent success check
- **Fichier**: `apps/web/src/app/[locale]/dashboard/employees/page.tsx` (ligne 31)
- **Probleme**: Verifie `empRes.data.success` mais si l'API retourne directement les donnees sans wrapper, la liste reste vide.
- **Fix**: Harmoniser le check avec le format reel de l'API.

### MED-10: useCallback missing deps in attestations
- **Fichier**: `apps/web/src/app/[locale]/employee/attestations/page.tsx` (ligne 38)
- **Probleme**: Dep array `[user?.employeeId]` manque la fonction `t()`.
- **Fix**: Ajouter `t` aux deps.

### MED-11: Leave status values not translated in config
- **Fichier**: `apps/web/src/app/[locale]/dashboard/leaves/page.tsx` (lignes 29-31)
- **Probleme**: STATUS_CONFIG utilise des valeurs en anglais ('PENDING', 'APPROVED') affichees directement.
- **Fix**: Utiliser les fonctions de traduction.

### MED-12: Missing performance middleware error handling
- **Fichier**: `apps/api/src/middleware/performance.ts`
- **Probleme**: Pas de gestion d'erreur verifiee dans ce middleware.
- **Fix**: Ajouter try/catch.

---

## 4. PROBLEMES BASSE PRIORITE (10)

### LOW-01: Inconsistent error handling patterns across dashboard
- Certaines pages utilisent `toast.error(t('error'))` (generique), d'autres des cles specifiques.
- **Fix**: Standardiser.

### LOW-02: ExportButtons missing aria-labels
- **Fichier**: `apps/web/src/components/ExportButtons.tsx`
- **Fix**: Ajouter `aria-label` pour l'accessibilite.

### LOW-03: Loading state not localized in DataTable
- **Fichier**: `apps/web/src/components/DataTable.tsx` (ligne 209)
- `'Chargement...'` en dur.
- **Fix**: Utiliser `texts.loading`.

### LOW-04: Organization page status hardcoded
- **Fichier**: `apps/web/src/app/[locale]/dashboard/organization/page.tsx` (ligne 206)
- `'ACTIVE'` affiche tel quel au lieu d'etre traduit.

### LOW-05: Missing idempotency on leave balance init
- Double appel possible sans verification.

### LOW-06: SQL injection risk minimal but worth noting
- **Fichier**: `apps/api/src/routes/attendance.routes.ts` (ligne 40)
- Prisma protege mais le route ordering pourrait poser probleme.

### LOW-07: Documents page endpoint inconsistency
- **Fichier**: `apps/web/src/app/[locale]/employee/documents/page.tsx`
- Charge depuis `/employees/{id}` mais telecharge depuis des URLs differentes.

### LOW-08: Missing `@@index` on frequently queried fields
- Plusieurs modeles manquent d'index sur les champs souvent filtres.

### LOW-09: API interceptor - potential hydration issue
- **Fichier**: `apps/web/src/lib/api.ts` (ligne 33)
- `useAuthStore.getState()` appele avant hydration du store = tenant undefined au premier chargement.

### LOW-10: Unused imports in some pages
- Quelques pages importent des composants ou icones non utilises.

---

## 5. TRADUCTIONS

Les fichiers `fr.json` et `ar.json` sont **parfaitement synchronises** :
- 32 sections identiques
- 1,311 cles identiques
- Aucune cle manquante, aucune valeur vide
- Placeholders `{variable}` coherents

---

## PRIORITE DE CORRECTION RECOMMANDEE

### Sprint 1 (Immediat - Bloquant)
1. CRIT-01: Route ordering employee `/export`, `/import-template`
2. CRIT-02 + CRIT-03: Cross-tenant isolation (advantages, departments)
3. CRIT-05: Hardcoded tenant ID
4. CRIT-08: API response format inconsistency
5. HIGH-01: Hardcoded French strings

### Sprint 2 (Urgent)
6. CRIT-04: Missing role middleware on leave routes
7. CRIT-07: DialogTrigger fix
8. HIGH-02: Missing translation keys
9. HIGH-03: Null checks on names
10. HIGH-05: Non-null assertion on tenant

### Sprint 3 (Important)
11. HIGH-06 + LOW-03: DataTable i18n
12. HIGH-07: Tenant parameter standardization
13. MED-01: Backend pagination
14. MED-07: API response standardization
15. MED-08: Payroll undefined departments

### Sprint 4 (Amelioration)
16. Tous les MED et LOW restants
