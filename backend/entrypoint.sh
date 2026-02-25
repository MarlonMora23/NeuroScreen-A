#!/bin/sh
set -e  # detener si cualquier comando falla

echo "Running migrations..."
flask db upgrade
echo "Migrations done."

echo "Creating admin if not exists..."
python - <<'EOF'
import os
import sys

sys.path.insert(0, '/app')

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    existing = User.query.filter_by(email='admin@neuroscreen.com').first()
    if not existing:
        admin = User(
            email='admin@neuroscreen.com',
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
exec "$@"