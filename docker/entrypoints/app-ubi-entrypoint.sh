#!/bin/bash
set -e

echo "[INFO] Starting Portabase on OpenShift..."

# Handle OpenShift arbitrary UID - add current user to /etc/passwd if not present
if ! whoami &>/dev/null 2>&1; then
    if [ -w /etc/passwd ]; then
        echo "default:x:$(id -u):0:Default User:/opt/app-root/src:/bin/bash" >> /etc/passwd
        echo "[INFO] Added current UID $(id -u) to /etc/passwd"
    fi
fi

export PGDATA=${PGDATA:-/data/postgres}
mkdir -p "$PGDATA" /data/private/uploads/tmp

# Fix PostgreSQL data directory permissions (required after OpenShift group permission changes)
chmod 700 "$PGDATA" 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo "[INFO] No DATABASE_URL provided, starting internal Postgres..."

    if [ ! -f "$PGDATA/PG_VERSION" ]; then
        echo "[INFO] Initializing database cluster..."
        initdb -D "$PGDATA" --auth=trust --no-locale 2>&1 || {
            echo "[ERROR] initdb failed"; exit 1;
        }
        echo "listen_addresses = 'localhost'" >> "$PGDATA/postgresql.conf"
        echo "port = 5432" >> "$PGDATA/postgresql.conf"
        echo "unix_socket_directories = '/tmp'" >> "$PGDATA/postgresql.conf"
        echo "logging_collector = off" >> "$PGDATA/postgresql.conf"
    fi

    pg_ctl -D "$PGDATA" -l /tmp/postgres.log start -w 2>&1 || {
        echo "[ERROR] PostgreSQL failed to start"
        cat /tmp/postgres.log 2>/dev/null
        exit 1
    }

    until pg_isready -h 127.0.0.1 -p 5432 2>/dev/null; do
        sleep 1
    done

    DB_USER="${POSTGRES_USER:-portabase}"
    DB_PASS="${POSTGRES_PASSWORD:-portabase123}"
    DB_NAME="${POSTGRES_DB:-portabase}"

    psql -h 127.0.0.1 -p 5432 -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1 || \
        psql -h 127.0.0.1 -p 5432 -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>&1
    psql -h 127.0.0.1 -p 5432 -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1 || \
        psql -h 127.0.0.1 -p 5432 -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>&1

    export DATABASE_URL="postgres://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"
    echo "[SUCCESS] Internal PostgreSQL started"
fi

# Run database migrations
echo "[INFO] Running database migrations..."
cd /opt/app-root/src
node -e "
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

migrate(db, { migrationsFolder: './src/db/migrations' })
  .then(() => { console.log('[SUCCESS] Migrations completed'); pool.end(); })
  .catch((err) => { console.error('[WARN] Migration error:', err.message); pool.end(); });
" 2>&1 || echo "[WARN] Migration script failed, app may handle migrations on startup"

echo "[INFO] Starting tusd server..."
tusd \
    --base-path /tus/files/ \
    --upload-dir /data/private/uploads/tmp \
    --hooks-http http://127.0.0.1:3000/api/tus/hooks \
    --port 1080 \
    --max-size 21474836480 &

echo "[INFO] Starting Next.js server..."
PORT=3000 HOSTNAME=0.0.0.0 node server.js &

echo "[INFO] Starting nginx on port 8080..."
exec nginx -g "daemon off;"
