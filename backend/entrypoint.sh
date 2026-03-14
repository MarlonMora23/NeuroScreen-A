#!/bin/bash
set -e

APP_ROLE="${APP_ROLE:-api}"

# ─── Permisos en volúmenes montados ────────────────────────────────────────
# Esto corre como root, por lo que puede corregir ownership de volúmenes
# montados externamente (named volumes o bind mounts del host)
echo "Fixing uploads directory permissions..."
mkdir -p /app/uploads/eeg
chown -R appuser:appuser /app/uploads

# ─── En dev: fix del bind mount /app completo ──────────────────────────────
# El bind mount ./backend:/app sobreescribe los permisos del Dockerfile.
# Solo aplicar si el owner de /app NO es appuser (evita trabajo innecesario en prod)
if [ "$(stat -c '%U' /app)" != "appuser" ]; then
    echo "Detected external bind mount on /app, fixing ownership..."
    chown -R appuser:appuser /app
fi

# ─── Migraciones y seed (como appuser para consistencia) ───────────────────
if [ "$APP_ROLE" = "api" ]; then
    echo "Running migrations..."
    count=0
    until gosu appuser flask db upgrade; do
        count=$((count + 1))
        if [ "$count" -ge 30 ]; then
            echo "Migrations failed after $count attempts, exiting."
            exit 1
        fi
        echo "Database not ready, retrying... (attempt $count/30)"
        sleep 2
    done
    echo "Migrations done."

    echo "Creating admin if not exists..."
    gosu appuser python - <<'PYEOF'
import os, sys
sys.path.insert(0, '/app')
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@neuroscreen.com')
    if not User.query.filter_by(email=admin_email).first():
        db.session.add(User(
            email=admin_email,
            password_hash=generate_password_hash(os.environ.get('ADMIN_PASSWORD', 'Admin123')),
            first_name='Admin',
            last_name='Principal',
            role=UserRole.ADMIN,
        ))
        db.session.commit()
        print('Admin created.')
    else:
        print('Admin already exists, skipping.')
PYEOF
    echo "Startup complete."
else
    echo "Worker mode: skipping migrations."
fi

# ─── Drop de privilegios ────────────────────────────────────────────────────
echo "Dropping privileges to appuser..."
exec gosu appuser "$@"