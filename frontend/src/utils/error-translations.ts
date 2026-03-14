/**
 * Translations for backend error messages
 * Maps English error messages from backend to Spanish equivalents
 */

const errorTranslations: Record<string, string> = {
  // Authentication errors
  "Invalid credentials":
    "Credenciales inválidas. Verifica tu correo y contraseña.",
  "Email and password are required":
    "Correo electrónico y contraseña son requeridos.",

  // User management errors
  "Only ADMIN can create users":
    "Solo los administradores pueden crear usuarios.",
  "Only ADMIN can list users":
    "Solo los administradores pueden listar usuarios.",
  "Only ADMIN can delete users":
    "Solo los administradores pueden eliminar usuarios.",
  "Not allowed to view this user":
    "No tienes permiso para ver este usuario.",
  "Not allowed to update this user":
    "No tienes permiso para actualizar este usuario.",
  "User not found": "Usuario no encontrado.",

  // Validation errors
  "Invalid email format": "Formato de email inválido.",
  "Email already registered": "Este email ya está registrado.",
  "Password must be at least 8 characters long":
    "La contraseña debe tener al menos 8 caracteres.",
  "First name cannot be empty": "El nombre no puede estar vacío.",
  "Last name cannot be empty": "El apellido no puede estar vacío.",
  "Invalid role": "Rol inválido.",
  "Role cannot be updated": "El rol no puede ser modificado.",

  // EEG record errors
  "patient_id must be a valid UUID":
    "El ID del paciente no es válido.",
  "Patient does not exist":
    "El paciente no existe.",
  "Not allowed to upload EEG for this patient":
    "No tienes permiso para cargar registros EEG para este paciente.",
  "No file provided":
    "No se proporcionó ningún archivo.",
  "File is empty":
    "El archivo está vacío.",
  "Error processing file":
    "Error al procesar el archivo. Por favor, verifica que sea un formato válido.",
  "EEG record not found":
    "Registro EEG no encontrado.",
  "Not allowed to access this record":
    "No tienes permiso para acceder a este registro.",
  "Not allowed to access this patient's records":
    "No tienes permiso para acceder a los registros de este paciente.",
  "Invalid status":
    "Estado inválido.",

  // EEG processing and visualization errors
  "No valid EEG samples generated from the provided file":
    "No se pudieron generar muestras EEG válidas del archivo proporcionado.",
  "No prediction found for this record":
    "No se encontró predicción para este registro.",
  "Patient not found":
    "Paciente no encontrado.",
  "GradientTape returned None gradients. Verifica que el modelo sea diferenciable y que X_tf esté siendo watched correctamente.":
    "Error al generar visualizaciones: no se pudieron calcular los gradientes. Por favor, reintentar más tarde.",
};

/**
 * Helper function to find and translate error messages with parameters
 * Handles cases like "File type '.txt' not allowed. Supported formats: ..."
 * and "File exceeds maximum allowed size of X MB"
 * @param errorMessage - The error message from the backend
 * @returns The translated error message or original if no match
 */
const translateDynamicError = (errorMessage: string): string => {
  // File type not allowed
  if (errorMessage.includes("not allowed") && errorMessage.includes("Supported formats")) {
    return "Formato de archivo no permitido. Por favor, verifica los formatos soportados.";
  }

  // File size exceeds limit
  if (errorMessage.includes("exceeds maximum allowed size")) {
    return "El archivo excede el tamaño máximo permitido.";
  }

  // Missing required columns in EEG file
  if (errorMessage.includes("Missing required columns")) {
    return "El archivo no contiene todas las columnas requeridas para el análisis. Columnas faltantes: " + errorMessage.split("Missing required columns:")[1].trim();
  }

  // Generic catch for "Error processing file" with additional details
  if (errorMessage.includes("Error processing file")) {
    return "Error al procesar el archivo. Por favor, verifica que sea un formato válido.";
  }

  // Missing channels error
  if (errorMessage.includes("Missing required channels:")) {
    return "El archivo no contiene todos los canales requeridos para el análisis. Canales faltantes: " + errorMessage.split("Missing required channels:")[1].trim();
  }

  return null;
};

/**
 * Translates a backend error message from English to Spanish
 * Handles both simple and dynamic error messages
 * @param errorMessage - The error message from the backend (in English)
 * @returns The translated error message in Spanish
 */
export const translateError = (errorMessage: string): string => {
  // First try exact match
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }

  // Then try dynamic patterns
  const dynamicTranslation = translateDynamicError(errorMessage);
  if (dynamicTranslation) {
    return dynamicTranslation;
  }

  // Return original if no translation found
  return errorMessage;
};

/**
 * Alias for backwards compatibility with existing code
 */
export const translateAuthError = (errorMessage: string): string => {
  return translateError(errorMessage);
};
