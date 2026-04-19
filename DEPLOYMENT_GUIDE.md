# Guide de Deploiement — Harmony ERP

**Stack :** Docker + GitHub Actions + VPS OVH
**Cout :** ~25 EUR/mois

---

## Etape 1 : Achat VPS OVH

1. https://www.ovhcloud.com/fr/vps/ → **VPS Comfort** (~22 EUR/mois)
   - 4 vCPU, 8 Go RAM, 160 Go SSD
   - Ubuntu 24.04 LTS
   - Backup auto : OUI (+2 EUR)
2. Tu recois par email : **IP du serveur** + mot de passe root

---

## Etape 2 : Config DNS

Chez ton registrar (OVH, Cloudflare, etc.) :

```
A     @                    IP_DU_VPS
A     www                  IP_DU_VPS
A     *.harmony-rh.com     IP_DU_VPS
```

---

## Etape 3 : Preparer le VPS (une seule fois)

```bash
ssh root@IP_DU_VPS

# Securite + Docker en une commande
apt update && apt upgrade -y && \
apt install -y curl ufw fail2ban && \
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable && \
curl -fsSL https://get.docker.com | sh && \
apt install -y docker-compose-plugin && \
adduser harmony && usermod -aG sudo,docker harmony

# Verifier Docker
docker --version
docker compose version
```

C'est tout pour le VPS. Plus rien a installer.

---

## Etape 4 : Fichiers Docker dans le projet

### Dockerfile (racine du projet)

Deja cree ci-dessous.

### docker-compose.yml (racine du projet)

Deja cree ci-dessous.

### nginx.conf

Deja cree ci-dessous.

---

## Etape 5 : Secrets GitHub

GitHub > ton repo > Settings > Secrets and variables > Actions :

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP du VPS |
| `VPS_USER` | `harmony` |
| `VPS_SSH_KEY` | Cle privee SSH (voir ci-dessous) |
| `JWT_SECRET` | Generer : `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | Generer : `openssl rand -hex 64` |
| `DB_PASSWORD` | Mot de passe PostgreSQL |

### Generer la cle SSH

Sur le VPS :
```bash
su - harmony
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Copier cette cle dans le secret VPS_SSH_KEY :
cat ~/.ssh/github_deploy
```

---

## Etape 6 : Push et c'est deploye

```bash
git add .
git commit -m "deploy: initial"
git push origin main
```

GitHub Actions fait tout automatiquement :
1. Build les images Docker
2. SSH vers le VPS
3. Pull les images
4. Demarre les containers
5. Lance les migrations Prisma
6. Nginx + SSL automatique

**Temps : ~5 minutes du push a la prod.**

---

## Fichiers a creer

### `Dockerfile`

```dockerfile
# ── Stage 1: Build ────────────────────────────
FROM node:22-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API
RUN cd apps/api && npx tsc

# Build Web
RUN cd apps/web && npm run build

# ── Stage 2: API ──────────────────────────────
FROM node:22-alpine AS api
RUN npm install -g pnpm
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]

# ── Stage 3: Web ──────────────────────────────
FROM node:22-alpine AS web
RUN npm install -g pnpm
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
```

### `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: harmony
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: harmony
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U harmony"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      target: api
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://harmony:${DB_PASSWORD}@db:5432/harmony
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
      PORT: "3001"
    ports:
      - "3001:3001"

  web:
    build:
      context: .
      target: web
    restart: always
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: https://${DOMAIN}/api
      NODE_ENV: production
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - api
      - web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    command: '/bin/sh -c ''while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g "daemon off;"'''

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  pgdata:
  certbot-etc:
  certbot-var:
```

### `nginx.conf`

```nginx
upstream api {
    server api:3001;
}

upstream web {
    server web:3000;
}

server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    client_max_body_size 5M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    location /api/ {
        proxy_pass http://api/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://web;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### `.env.production` (sur le VPS, pas dans le repo)

```bash
DB_PASSWORD=MOT_DE_PASSE_FORT
JWT_SECRET=CLE_GENEREE_64_CHARS
JWT_REFRESH_SECRET=AUTRE_CLE_64_CHARS
DOMAIN=harmony-rh.com
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy Harmony ERP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/harmony/harmony
            git pull origin main

            # Creer le .env si pas encore fait
            cat > .env.production << EOF
            DB_PASSWORD=${{ secrets.DB_PASSWORD }}
            JWT_SECRET=${{ secrets.JWT_SECRET }}
            JWT_REFRESH_SECRET=${{ secrets.JWT_REFRESH_SECRET }}
            DOMAIN=harmony-rh.com
            EOF

            # Build et deploy
            docker compose --env-file .env.production up -d --build

            # Migrations
            docker compose exec api npx prisma db push --accept-data-loss

            echo "Deployed at $(date)"
```

---

## Commandes utiles

| Action | Commande |
|--------|----------|
| Demarrer | `docker compose --env-file .env.production up -d` |
| Arreter | `docker compose down` |
| Rebuild | `docker compose --env-file .env.production up -d --build` |
| Logs API | `docker compose logs -f api` |
| Logs Web | `docker compose logs -f web` |
| Logs tout | `docker compose logs -f` |
| Shell API | `docker compose exec api sh` |
| Shell DB | `docker compose exec db psql -U harmony` |
| Backup DB | `docker compose exec db pg_dump -U harmony harmony > backup.sql` |
| Restaurer DB | `cat backup.sql \| docker compose exec -T db psql -U harmony harmony` |
| Status | `docker compose ps` |

---

## SSL : Premiere fois

Avant le premier lancement avec HTTPS, generer le certificat :

```bash
# Sur le VPS, temporairement commenter le bloc server 443 dans nginx.conf
# Puis :
docker compose --env-file .env.production up -d
docker compose exec certbot certbot certonly --webroot -w /var/lib/letsencrypt \
  -d harmony-rh.com -d www.harmony-rh.com --email admin@harmony-rh.com --agree-tos

# Remettre le bloc 443, puis :
docker compose --env-file .env.production up -d --build
```

Le renouvellement est automatique (container certbot tourne en boucle).

---

## Resume

```
Developper en local
       |
  git push main
       |
  GitHub Actions (SSH vers VPS)
       |
  docker compose up -d --build
       |
  PostgreSQL + API + Next.js + Nginx + SSL
       |
  https://harmony-rh.com ✓
```

**6 etapes au total :**
1. Acheter VPS
2. Config DNS
3. Installer Docker sur le VPS (1 commande)
4. Configurer les secrets GitHub
5. git push
6. C'est en ligne
