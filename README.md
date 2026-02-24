# NeuroScreen-A - Sistema de Detección Temprana de Alcoholismo

## 📋 Descripción General

NeuroScreen-A es una aplicación web full-stack para la detección temprana de alcoholismo mediante análisis de registros EEG y modelos de machine learning.

**Estado**: ✅ Frontend y Backend totalmente integrados

## 🚀 Inicio Rápido

### Con Docker Compose (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

Accede a:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000

### Sin Docker

```bash
# Terminal 1: Backend
cd backend
python run.py

# Terminal 2: Frontend
cd frontend
npm install
VITE_API_URL=http://localhost:5000 npm run dev
```

## 📁 Estructura del Proyecto

```
NeuroScreen-A/
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── config/           # Configuración de API
│   │   ├── services/         # Servicios HTTP
│   │   ├── contexts/         # Context de autenticación
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas principales
│   │   └── App.tsx
│   ├── .env.example          # Variables de entorno
│   └── package.json
│
├── backend/                    # Flask + SQLAlchemy
│   ├── app/
│   │   ├── routes/           # Endpoints API
│   │   ├── services/         # Lógica de negocio
│   │   ├── models/           # Modelos de BD
│   │   ├── ml/              # Modelos ML
│   │   └── tasks/           # Tareas asíncronas
│   ├── dl_models/           # Modelos EEGNet
│   ├── migrations/          # Migraciones DB
│   └── run.py
│
└── docker-compose.yml         # Orquestación de servicios
```

## 🔧 Configuración

### Frontend (.env - Raíz)

Todas las variables de entorno se configuran en un único archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:5000
POSTGRES_USER=eeguser
POSTGRES_PASSWORD=eegpassword
# ... más variables
```

### Backend (app/config.py)

Configurar según el ambiente (desarrollo, pruebas, producción).

## 📚 Documentación

- **[backend/readme.md](./backend/readme.md)** - Documentación del backend
- **[frontend/README.md](./frontend/README.md)** - Documentación del frontend

## ✨ Características

### Autenticación
- ✅ Login/Logout
- ✅ JWT tokens
- ✅ Persistencia de sesión
- ✅ Rutas protegidas

### Gestión de Datos
- ✅ CRUD de pacientes
- ✅ Gestión de usuarios
- ✅ Carga de archivos EEG
- ✅ Predicciones en tiempo real

### UI/UX
- ✅ Dashboard intuitivo
- ✅ Indicadores de carga
- ✅ Manejo de errores
- ✅ Responsive design

## 🔐 Seguridad

- JWTs para autenticación
- CORS configurado
- Validación en frontend y backend
- Rutas protegidas

## 🗂️ Stack Tecnológico

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- Framer Motion

### Backend
- Flask
- SQLAlchemy
- PostgreSQL
- Celery (tareas asíncronas)
- TensorFlow/Keras (modelos ML)

## 📝 Primeros Pasos

1. **Configura el entorno**
   ```bash
   # Copia .env.example a .env
   cp frontend/.env.example frontend/.env
   ```

2. **Levanta los servicios**
   ```bash
   docker-compose up
   ```

3. **Accede a la aplicación**
   - Frontend: http://localhost:8080
   - Backend: http://localhost:5000

4. **Crea un usuario admin (opcional)**
   ```bash
   cd backend
   python create_admin.py
   ```

5. **Inicia sesión**
   - Email: usuario@ejemplo.com
   - Contraseña: configurada en paso anterior

## 🐛 Troubleshooting

### Error: Cannot reach backend
- Verifica que el backend está ejecutándose (puerto 5000)
- Verifica la URL en `.env` del frontend

### Error: CORS
- Asegúrate de que el backend tiene CORS habilitado
- Verifica los orígenes permitidos

### Error: 401 Unauthorized
- El token puede haber expirado
- Intenta cerrar sesión y volver a iniciar

## 📊 Endpoints Principales

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Pacientes
- `GET/POST /api/patients`
- `GET/PUT/DELETE /api/patients/<id>`

### Usuarios
- `GET/POST /api/users`
- `GET/PUT/DELETE /api/users/<id>`

### Registros EEG
- `GET/POST /api/eeg-records`
- `POST /api/eeg-records/upload`
- `GET /api/eeg-records/<id>/prediction`

Más detalles en [backend/readme.md](./backend/readme.md)

## 🚢 Despliegue

Ver guías de despliegue en:
- Frontend: Netlify, Vercel, Azure Static Web Apps
- Backend: Heroku, Azure App Service, AWS EC2

## 📞 Soporte

Para reportar bugs o sugerencias, crea un Issue en el repositorio.

## 📄 Licencia

[no definida]

---

**Última actualización**: Febrero 2026

¿Necesitas ayuda? Revisa [QUICK_START.md](./QUICK_START.md) o [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
