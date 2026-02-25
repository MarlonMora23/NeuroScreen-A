# NeuroScreen-A - Sistema de Detección Temprana de Alcoholismo

## 📋 Descripción General

NeuroScreen-A es una aplicación web full-stack para la detección temprana de alcoholismo mediante análisis de registros EEG y modelos de machine learning.

**Estado**: ✅ Frontend y Backend totalmente integrados

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

### Requisitos Principales
- Docker
- Docker Compose

### 1️⃣ Configurar el Entorno
```bash
# En la raíz del proyecto, copia .env.example a .env
cp frontend/.env.example .env
```

### 2️⃣ Levantar Todo con Docker (Opción Recomendada ⭐)
**Esta es la forma recomendada y más sencilla:**

En la raíz del proyecto, ejecuta:
```bash
docker-compose up --build
```

Esto levanta automáticamente:
- ✅ Backend (Flask) en `http://localhost:5000`
- ✅ Frontend (React) en `http://localhost` (sirve a través de Nginx)
- ✅ PostgreSQL (base de datos)
- ✅ Redis (cache y Celery)
- ✅ Celery Worker (procesamiento asíncronico de EEG)

### 3️⃣ Accede a la Aplicación
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000

### 4️⃣ Crear Usuario Admin (Opcional)
```bash
# Dentro del contenedor del backend
docker exec neuroscreen_api python create_admin.py
```

### 5️⃣ Inicia Sesión
- Email: usuario@ejemplo.com (o el configurado en el paso anterior)
- Contraseña: la configurada

---

## 🔄 Desarrollo Local del Frontend (Alternativa)

Si quieres desarrollar el frontend con **hot-reload** y cambios en tiempo real, puedes ejecutar el frontend localmente mientras mantienes Docker para backend y dependencias:

### Requisitos Adicionales
- Node.js 18+
- npm o bun

### Pasos

1. **Levantar solo los servicios de backend con Docker**:
   ```bash
   docker-compose up db redis api worker
   ```

2. **En otra terminal, instala dependencias del frontend**:
   ```bash
   cd frontend
   npm install
   ```

3. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en `http://localhost:5173`

**Ventajas**: Hot-reload, cambios instantáneos en desarrollo  
**Desventajas**: Requiere Node.js instalado localmente

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
