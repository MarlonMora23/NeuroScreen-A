# Frontend - NeuroScreen-A

Interface web moderna y responsiva para la gestión de pacientes, registros EEG y predicciones de análisis neurológico.

## 🛠️ Stack Tecnológico

- **React 18** - Librería UI
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos utilities
- **shadcn/ui** - Componentes UI reutilizables
- **React Router v6** - Enrutamiento
- **TanStack Query** - Manejo de estado async
- **React Hook Form + Zod** - Formularios con validación
- **Recharts** - Visualización de datos
- **Supabase JS** - Integración auth
- **Framer Motion** - Animaciones
- **Vitest** - Testing

## 📁 Estructura del Proyecto

```
src/
├── components/              # Componentes reutilizables
│   ├── ui/                 # Componentes shadcn/ui
│   ├── dashboard/          # Componentes del dashboard
│   ├── EEGSignalPreview.tsx
│   ├── EEGWave.tsx
│   ├── Navbar.tsx
│   ├── Features.tsx
│   └── protected-route.tsx
├── contexts/               # Context API
│   └── auth-context.tsx    # Contexto de autenticación
├── pages/                  # Páginas principales
│   ├── Index.tsx          # Página de inicio
│   ├── Login.tsx          # Página de autenticación
│   ├── Dashboard.tsx      # Dashboard principal
│   └── NotFound.tsx       # Página 404
├── services/              # Servicios HTTP
│   ├── auth-service.ts
│   ├── eeg-service.ts
│   ├── patient-service.ts
│   └── ...
├── hooks/                 # Custom hooks
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── config/               # Configuración
│   └── api.ts           # Configuración de endpoints
├── lib/                 # Utilidades
│   └── utils.ts
├── integrations/        # Integraciones externas
│   └── supabase/
├── test/               # Tests
├── App.tsx
├── main.tsx
└── index.css
```

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado ⭐)

**Este es el método más simple y recomendado para ejecutar todo el proyecto:**

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

El frontend estará disponible en `http://localhost:8080/neuro/`.  
No requiere Node.js instalado en tu máquina.

Ver detalles completos en [readme.md](/readme.md).

---

### Opción 2: Desarrollo Local (Con hot-reload)

**Usa esta opción si quieres cambios instantáneos mientras desarrollas:**

#### Prerrequisitos
- Node.js 18+
- npm o bun

#### Instalación

```bash
cd frontend

# Instalar dependencias
npm install
# o con bun
bun install
```

#### Inicia el Servidor de Desarrollo

```bash
# Primero asegúrate que el backend esté corriendo:
# docker-compose up db redis api worker

# Luego en otra terminal:
npm run dev

# El frontend estará disponible en http://localhost:8081/neuro/
```

#### Build para Producción

```bash
nom run build
```

Esto genera una carpeta `dist/` lista para servir. En Docker, este paso se ejecuta automáticamente.

Ver configuración completa en [readme.md](/readme.md).

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera optimizado para producción |
| `npm run build:dev` | Build en modo desarrollo |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta tests una vez |
| `npm run test:watch` | Ejecuta tests en modo watch |

## 🏗️ Arquitectura

### Autenticación

El flujo de autenticación se maneja a través del `AuthContext`:
- Gestiona el estado del usuario logueado
- Persiste sesión en localStorage
- Proporciona métodos de login/logout
- Integración con Supabase para JWT

### Protección de Rutas

La ruta `/dashboard` es protegida mediante el componente `ProtectedRoute` que redirige a login si el usuario no está autenticado.

### Consumo de APIs

Los servicios HTTP se encuentran en `src/services/` y utilizan TanStack Query para:
- Caching automático
- Sincronización de datos
- Retry automático
- Invalidación de caché

### Formularios

Se utiliza React Hook Form con Zod para:
- Validación automática
- Manejo de errores
- Experiencia de usuario mejorada

## 🎨 Componentes Principales

### Pages
- **Index** - Landing page con información del producto
- **Login** - Autenticación de usuarios
- **Dashboard** - Panel principal con gestión de pacientes y análisis

### Componentes
- **Navbar** - Barra de navegación responsive
- **EEGSignalPreview** - Visualización de señales EEG
- **EEGWave** - Gráfico de ondas EEG
- **Features** - Sección de características
- **InterpretabilityCharts** - Gráficas de interpretabilidad (feature importance, topomap, waveforms) disponibles en detalle de registro EEG

## 📦 Dependencias Principales

- **@radix-ui/\*** - Componentes accesibles base
- **@tanstack/react-query** - Manejo de estado async
- **react-router-dom** - Enrutamiento
- **framer-motion** - Animaciones
- **recharts** - Gráficos
- **react-hook-form** - Gestión de formularios
- **zod** - Validación de datos
- **tailwindcss** - Framework CSS

## 🐛 Debugging

El proyecto incluye:
- Source maps para debugging en desarrollo
- React DevTools compatible
- ESLint para code quality

## 🤝 Integración con Backend

El frontend se conecta con el backend (Flask) a través de la API REST.

Endpoints base configurados en `src/config/api.ts`.
Se ha añadido soporte para visualizar interpretabilidad de modelos mediante nuevos endpoints de visualizaciones (`/eeg-records/<id>/visualizations`), que entregan datos de feature importance, mapas topográficos y formas de onda.
Para más información sobre los endpoints, consultar la documentación del backend en `backend/readme.md`.

## 🔐 Seguridad

- Almacenamiento seguro de tokens en contexto
- Validación de datos con Zod
- CSRF protection a través de headers
- Sanitización de inputs en formularios

## 📱 Responsividad

El frontend es completamente responsive:
- Mobile first approach
- Tailwind CSS breakpoints
- Componentes adaptables
- Hook `use-mobile` para lógica responsiva

## 🚀 Deployment

Para desplegar en producción:

```bash
npm run build
```

Esto genera una carpeta `dist/` lista para servir con cualquier servidor web estático.

Ver configuración en `nginx.conf` para deployment con Nginx.

## 📄 Licencia

Mismo que el proyecto padre NeuroScreen-A.

## 📞 Soporte

Para reportar bugs o sugerencias, consulta el repositorio principal del proyecto.
