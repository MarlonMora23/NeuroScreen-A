# NeuroScreen-A - Sistema de Detección Temprana de Alcoholismo

<img width="1246" height="832" alt="Screenshot 2026-02-24 185555" src="https://github.com/user-attachments/assets/06627a16-71c3-439c-b027-93ad0bf6399e" />

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
- ✅ Visualización de interpretabilidad

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
Todas las variables de entorno se configuran en un único archivo `.env` en la raíz del proyecto, copia el .env.example para tener la base de cuales variables configurar: 

```bash
# En la raíz del proyecto, copia .env.example a .env
cp .env.example .env
```

Luego entra al .env y digita los valores correspondientes al entorno (desarollo o producción)

```env
# Para desarrollo
VITE_API_URL=http://localhost:5000
POSTGRES_USER=eeguser
POSTGRES_PASSWORD=eegpassword
# ... más variables

# Para producción
VITE_API_URL=http://tu_dominio.com
POSTGRES_USER=eeguser
POSTGRES_PASSWORD=your-secure-production-password
```

### 2️⃣ Levantar Todo con Docker 
**Esta es la forma recomendada y más sencilla:**

En la raíz del proyecto, ejecuta:
```bash
docker-compose up --build
```

**Estos comandos levanta automáticamente:**
- ✅ Backend (Flask) en `http://localhost:5000`
- ✅ Frontend (React) en `http://localhost:8080/neuro/` (sirve a través de Nginx)
- ✅ PostgreSQL (base de datos)
- ✅ Redis (cache y Celery)
- ✅ Celery Worker (procesamiento asíncronico de EEG)

### 3️⃣ Accede a la Aplicación
- **Frontend**: http://localhost:8080/neuro/
- **Backend API**: http://localhost:5000

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
   El frontend estará disponible en `http://localhost:8081/neuro`

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
