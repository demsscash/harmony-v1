# Audit Complet - Harmony ERP

**Date :** 17 Avril 2026  
**Version :** Post-refonte pointage + signatures + hierarchie

---

## 1. Architecture

| Couche | Techno | Port |
|--------|--------|------|
| Frontend | Next.js 16, TypeScript, Tailwind v4, Shadcn/UI | 3000 |
| Backend | Express.js 5, TypeScript, Prisma | 3001 |
| Base de donnees | PostgreSQL | 5433 |
| Monorepo | Turborepo + pnpm | - |
| Multi-tenant | Header X-Tenant-Subdomain | - |
| i18n | next-intl (FR, AR, ZH) + RTL | - |

---

## 2. Modules (27 routes API, 35+ pages frontend)

| Module | Backend | Frontend | Status |
|--------|---------|----------|--------|
| Auth (login tenant + super admin separes) | 6 endpoints | 4 pages | OK |
| Employes (CRUD, badge PDF, contrat PDF, terminate) | 12 endpoints | 5 pages | OK |
| Unites Org (Direction/Departement/Service) | 4 endpoints | 1 page | OK |
| Organigramme (vue unites + employes) | 2 endpoints | 1 page | OK |
| Primes & Indemnites (CRUD + affectation employe) | 7 endpoints | 1 page + onglet | OK |
| Conges (CRUD, approbation, calendrier) | 10+ endpoints | 3 pages | OK |
| Paie (campagnes, bulletins, actualisation, PDF) | 8 endpoints | 2 pages | OK |
| Pointage (codes configurables, grille semaine/mois) | 8 endpoints | 1 page + settings | OK |
| Sanctions (CRUD, integration paie) | 6 endpoints | 1 page + onglet | OK |
| Signatures (3 workflows, double signature, PDF) | 10 endpoints | 4 pages | OK |
| Heures supplementaires | 5 endpoints | 1 page | OK |
| Acomptes sur salaire | 5 endpoints | 1 page | OK |
| Notes de frais | 6 endpoints | 1 page | OK |
| Evaluations | 5 endpoints | 1 page | OK |
| Utilisateurs (CRUD, liaison employe) | 5 endpoints | 1 page | OK |
| Parametres (tenant, logo, SMTP, taxes, codes) | 6 endpoints | 1 page | OK |
| Rapports RH | 3 endpoints | 1 page | OK |
| DGI (declarations fiscales) | 3 endpoints | 1 page | OK |
| Portail employe | - | 8 pages | OK |
| Super Admin (tenants, monitoring) | 7 endpoints | 3 pages | OK |

---

## 3. Formule Bulletin de Salaire

```
BRUT = (Base + Primes + Heures supp) / Jours du mois x Jours payes
Jours payes = Jours du mois - Absences deductibles (codes marques "deduit")

RETENUES SALARIALES :
  CNSS = min(Brut, Plafond) x Taux (configurable)
  CNAM = min(Brut, Plafond) x Taux (configurable)
  ITS  = bareme progressif sur (Brut - CNSS - CNAM)

NET = Brut - CNSS - CNAM - ITS - Acomptes - Sanctions

CHARGES PATRONALES (non deduites du net) :
  CNSS employeur = min(Brut, Plafond) x Taux
  MDT = Brut x Taux
```

---

## 4. Pointage - Nouveau systeme

- Codes configurables par tenant (T, AB, PR, PS, RM, RS + custom)
- Flag `deductsSalary` par code (seules les absences impactent la paie)
- Grille semaine (7 colonnes) ou mois (30 colonnes)
- Remplissage rapide : "Tout T", par ligne, par colonne
- Auto-save par cellule (pas de bouton enregistrer)
- Filtres : departement + recherche employe

---

## 5. Signatures - 3 workflows

| Cas | Initiateur | Signataire(s) | Flow |
|-----|------------|---------------|------|
| Doc envoye par HR | Admin | Employe | PENDING > SIGNED |
| Contrat (double) | Admin | Employe + Admin | PENDING > AWAITING_ADMIN > SIGNED |
| Doc demande par employe | Employe | Admin valide | AWAITING_VALIDATION > SIGNED/REJECTED |

- PDF stocke en base (pas genere a la volee)
- Visualisation PDF avant signature
- Double signature simultanee possible (admin saisit les deux)
- Sans validation admin = document caduc

---

## 6. Hierarchie organisationnelle

- 3 types : DIRECTION / DEPARTMENT / SERVICE
- Validation automatique : Direction=racine, Dept sous Direction, Service sous Dept
- Responsable assignable par unite
- Organigramme : toggle Vue Unites / Vue Employes

---

## 7. Bugs corriges dans cette session

| Bug | Cause | Correction |
|-----|-------|------------|
| Flash dashboard avant redirect login | Pas d'auth dans middleware + Zustand async | Middleware serveur + AuthProvider bloquant |
| Slash dans montants PDF (55 /000) | Espace insecable de toLocaleString | .replace(/\s/g, ' ') |
| Cookie refresh jamais envoye | sameSite:strict + cross-origin | sameSite:lax + hostname dynamique |
| Deconnexion apres 15min | Token trop court, refresh fail | AccessToken 1h, RefreshToken 30j |
| 22 jours/mois hardcode | Valeur fixe dans calcul paie | Calcul jours reels du mois |
| Placeholders trop clairs | Couleur trop proche du texte | placeholder:italic placeholder:opacity-60 |
| Logo pas reactif apres changement | State local au lieu de Zustand | Zustand store partage |
| Badge PDF moche | Design basique, pas de photo | Nouveau design avec photo employee |
| Contrat PDF variables non remplacees | Template custom avec mauvais format | Normalisation + map complete des variables |
| Texte bouton "Generer acces" invisible | bg-slate-900 sans text-white | Ajout text-white |
| DataTable th/td desalignes | Flex wrapper sans justify | justify-end/center selon className |
| Affectation prime employe 500 error | Route POST /allowances = CRUD avantage | Nouvelle route /allowances/employee-assign |

---

## 8. Dead code a supprimer

| Fichier | Element | Impact |
|---------|---------|--------|
| settings/page.tsx | Fonction _DELETED_OrgLevelsCard (~160 lignes) | Aucun (jamais appelee) |
| Messages JSON (fr/ar/zh) | Cles orgLevels.* | Traductions orphelines |

---

## 9. Risques et limites

### Securite
- Signatures electroniques = images PNG (pas de signature cryptographique)
- PDF signes reconstruits a chaque telechargement (pas d'archive immuable)
- Photos et PDF stockes en base64 dans PostgreSQL (lourd)

### Performance
- Pas de React Query / TanStack Query (pas de cache frontend)
- Bulk upsert pointage = N requetes sequentielles (pas de createMany)
- Photos employe en base64 (pas de CDN/S3)

### Fonctionnel
- Pas de workflow n8n operationnel (1 sur 14)
- Pas d'envoi email reel (rappels, notifications)
- Pas de prorata si employe arrive en milieu de mois
- Pas de jours feries integres dans le pointage automatique
- Pas de landing page marketing

---

## 10. Recommandations

| Priorite | Action | Effort |
|----------|--------|--------|
| HAUTE | Supprimer dead code OrgLevelsCard | 5 min |
| HAUTE | Tester paie complete (1 mois reel avec pointage) | 1h |
| HAUTE | Verifier tous les PDF (bulletin, contrat, badge, attestation) | 30 min |
| MOYENNE | Stockage fichiers S3/Minio au lieu de base64 | Moyen |
| MOYENNE | Implementer envoi emails (rappels signature, contrat expirant) | Moyen |
| MOYENNE | Ajouter React Query pour cache et performance | Moyen |
| MOYENNE | Integrer jours feries dans le pointage | Petit |
| BASSE | Landing page marketing harmony-rh.com | Majeur |
| BASSE | Workflows n8n complets (13 manquants) | Majeur |
| BASSE | Signature cryptographique (conformite legale) | Majeur |
