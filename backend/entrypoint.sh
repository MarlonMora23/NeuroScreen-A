#!/bin/sh
set -e

APP_ROLE="${APP_ROLE:-api}"

if [ "$APP_ROLE" = "api" ]; then
    echo "Waiting for database and running migrations..."
    count=0
    until flask db upgrade; do
        count=$((count + 1))
        if [ $count -ge 30 ]; then
            echo "Failed to run migrations after $count attempts, exiting."
            exit 1
        fi
        echo "Database not ready, retrying in 2 seconds... (attempt $count)"
        sleep 2
    done
    echo "Migrations done."

    echo "Creating admin if not exists..."
    python - <<'EOF'
import os, sys
sys.path.insert(0, '/app')
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@neuroscreen.com')
    existing = User.query.filter_by(email=admin_email).first()
    if not existing:
        admin = User(
            email=admin_email,
            password_hash=generate_password_hash(os.environ.get('ADMIN_PASSWORD', 'Admin123')),
            first_name='Admin',
            last_name='Principal',
            role=UserRole.ADMIN,
        )
        db.session.add(admin)
        db.session.commit()
        print('Admin created successfully')
    else:
        print('Admin already exists, skipping')
EOF
    echo "Startup complete."
else
    echo "Worker mode: skipping migrations."
fi

exec "$@"