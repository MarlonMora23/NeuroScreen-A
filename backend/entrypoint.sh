#!/bin/sh
echo "Running migrations..."
flask db upgrade

echo "Creating admin if not exists..."

ADMIN_PASSWORD=${ADMIN_PASSWORD:-Admin123}

flask shell -c "
from app.extensions import db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

existing = User.query.filter_by(email='admin@neuroscreen.com').first()
if not existing:
    admin = User(
        email='admin@neuroscreen.com',
        password_hash=generate_password_hash('${ADMIN_PASSWORD}'),
        first_name='Admin',
        last_name='Principal',
        role=UserRole.ADMIN,
    )
    db.session.add(admin)
    db.session.commit()
    print('Admin created')
else:
    print('Admin already exists, skipping')
"

exec "$@"