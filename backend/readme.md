# NeuroScreen-A Backend

NeuroScreen-A es el backend para un sistema de detección temprana de alcoholismo. Proporciona servicios de procesamiento de datos EEG, inferencia de modelos de machine learning y gestión de usuarios y pacientes.

## Descripción
Este backend está diseñado para soportar la aplicación NeuroScreen-A, que ayuda en la detección temprana de alcoholismo mediante el análisis de registros EEG y la predicción basada en modelos de aprendizaje automático.

## Requisitos
- Docker
- Docker Compose

## 🚀 Levantar el Sistema

**Esta es la forma correcta de ejecutar el backend:**

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

**Esto levanta automáticamente:**
- ✅ Backend (Flask API)
- ✅ Base de datos (PostgreSQL)
- ✅ Cache (Redis)
- ✅ Celery Worker (procesamiento asíncronico)
- ✅ Frontend (React con Nginx)

> **Nota**: No intentes correr `python run.py` directamente sin Docker, ya que Celery no funcionará sin Redis ni el worker ejecutándose en paralelo.

### URLs de Acceso
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost`

Ver configuración completa y opciones de desarrollo en [readme.md](/readme.md)

## Estructura del proyecto
- `app/`: Código fuente principal
- `dl_models/`: Modelos de machine learning
- `migrations/`: Migraciones de base de datos
- `tests/`: Pruebas unitarias

## Rutas disponibles (API Endpoints)

### Autenticación (Auth)
| Método | Ruta | Propósito |
|:------:|:-----|:---------|
| **POST** | `api/auth/login` | Iniciar sesión con credenciales de usuario |
| **POST** | `api/auth/logout` | Cerrar sesión (requiere token JWT) |
| **GET** | `api/auth/me` | Obtener información del usuario autenticado actual |

### Usuarios
| Método | Ruta | Propósito |
|:------:|:-----|:---------|
| **POST** | `api/users` | Crear un nuevo usuario (requiere permisos de administrador) |
| **GET** | `api/users` | Listar todos los usuarios |
| **GET** | `api/users/<user_id>` | Obtener información de un usuario específico por ID |
| **PUT** | `api/users/<user_id>` | Actualizar información de un usuario |
| **DELETE** | `api/users/<user_id>` | Eliminar un usuario |

### Pacientes
| Método | Ruta | Propósito |
|:------:|:-----|:---------|
| **POST** | `api/patients` | Crear un nuevo paciente |
| **GET** | `api/patients` | Listar pacientes con filtros opcionales (número de identificación, nombre, apellido, registros EEG, EEG pendientes) |
| **GET** | `api/patients/<patient_id>` | Obtener información completa de un paciente específico |
| **PUT** | `api/patients/<patient_id>` | Actualizar información de un paciente |
| **DELETE** | `api/patients/<patient_id>` | Eliminar un paciente |

### Registros EEG
| Método | Ruta | Propósito |
|:------:|:-----|:---------|
| **POST** | `api/eeg-records/upload` | Subir un archivo EEG para procesamiento (inicia tarea asíncrona) |
| **GET** | `api/eeg-records` | Listar todos los registros EEG con filtros opcionales (patient_id, status) |
| **GET** | `api/eeg-records/<eeg_id>` | Obtener detalles de un registro EEG específico |
| **GET** | `api/patients/<patient_id>/eeg-records` | Obtener todos los registros EEG de un paciente específico |
| **GET** | `api/eeg-records/<eeg_id>/status` | Obtener el estado actual de procesamiento de un registro EEG |
| **DELETE** | `api/eeg-records/<eeg_id>` | Eliminar un registro EEG |

### Resultados de Predicciones
| Método | Ruta | Propósito |
|:------:|:-----|:---------|
| **GET** | `api/eeg-records/<eeg_record_id>/prediction` | Obtener el resultado de predicción asociado a un registro EEG específico |
| **GET** | `api/patients/<patient_id>/predictions` | Obtener el historial completo de predicciones de un paciente |
| **GET** | `api/predictions` | Listar todas las predicciones del sistema (solo administrador) |

## Notas de seguridad
- Todas las rutas requieren autenticación mediante token JWT (excepto `/auth/login`)
- Los permisos se validan según el rol del usuario
- Los usuarios solo pueden ver información de sus propios pacientes
- Los administradores tienen acceso completo a todos los recursos

## 🧪 Testing

```bash
# Ejecutar tests
pytest -q
```

## 📄 Licencia

Mismo que el proyecto padre NeuroScreen-A.

## 📞 Soporte

Para reportar bugs o sugerencias, consulta el repositorio principal del proyecto.



