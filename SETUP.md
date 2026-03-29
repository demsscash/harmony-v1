# Harmony ERP - Guide d'installation locale 


## Prerequis

- **Node.js** 18+
- **pnpm** 10+ (`npm install -g pnpm`)
- **PostgreSQL** 13+

## 1. Cloner le projet

```bash
git clone <url-du-repo>
cd harmony
```

## 2. Installer les dependances

```bash
pnpm install
```

## 3. Configurer la base de donnees

Creer une base PostgreSQL :

```sql
CREATE DATABASE harmony;
```

## 4. Configurer les variables d'environnement

### Backend — `apps/api/.env`

```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/harmony?schema=public"
JWT_SECRET="harmony_super_secret_for_jwt_auth_123!"
JWT_REFRESH_SECRET="harmony_refresh_secret_for_jwt_auth_456!"

# Optionnel — pour l'envoi d'emails
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER=""
SMTP_PASSWORD=""
```

> Adapter `postgres:postgres` et le port `5432` selon ta config PostgreSQL locale.

### Frontend — `apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
```

## 5. Initialiser la base de donnees

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..
```

Le seed cree :
- **Tenant** : Harmony Enterprise (subdomain: `demo`)
- **Super Admin** : `admin@harmony-erp.com` / `Admin@123`

## 6. Lancer l'application

Depuis la racine du projet :

```bash
pnpm dev
```

Cela demarre les deux apps en parallele :
- **Frontend** : http://localhost:3000
- **Backend API** : http://127.0.0.1:3001/api

## 7. Se connecter

1. Ouvrir http://localhost:3000
2. Se connecter avec `admin@harmony-erp.com` / `Admin@123`
3. Le subdomain `demo` est utilise automatiquement en local

## Structure du projet

```
harmony/
├── apps/
│   ├── api/          # Express.js + Prisma (port 3001)
│   └── web/          # Next.js App Router (port 3000)
├── packages/
│   └── shared/       # Utilitaires partages
├── turbo.json        # Config Turborepo
└── pnpm-workspace.yaml
```

## Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Lancer les deux apps en dev |
| `pnpm build` | Build de production |
| `cd apps/api && npx prisma studio` | Interface visuelle pour la BDD |
| `cd apps/api && npx prisma migrate dev` | Appliquer les migrations |

## Stack technique

- **Frontend** : Next.js 16, React 19, TypeScript, Tailwind CSS 4, Shadcn/UI
- **Backend** : Express 5, TypeScript, Prisma 6, PostgreSQL
- **Monorepo** : Turborepo + pnpm
- **Multi-tenant** : Chaque requete API porte un header `X-Tenant-Subdomain`
- **Roles** : SUPER_ADMIN, ADMIN, HR, EMPLOYEE

## En cas de probleme

- Verifier que PostgreSQL tourne et que la `DATABASE_URL` est correcte
- Verifier que les ports 3000 et 3001 ne sont pas deja utilises
- Relancer `pnpm install` si des modules manquent
- `npx prisma migrate reset` pour repartir d'une base propre (supprime toutes les donnees)
