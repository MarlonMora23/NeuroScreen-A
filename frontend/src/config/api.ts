/**
 * API Configuration
 * Define la URL base del backend y constantes de configuración
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",

  // Users
  USERS: "/api/users",
  USER_BY_ID: (id: string) => `/api/users/${id}`,

  // Patients
  PATIENTS: "/api/patients",
  PATIENT_BY_ID: (id: string) => `/api/patients/${id}`,
  PATIENT_EEG_RECORDS: (id: string) => `/api/patients/${id}/eeg-records`,
  PATIENT_PREDICTIONS: (id: string) => `/api/patients/${id}/predictions`,

  // EEG Records
  EEG_RECORDS: "/api/eeg-records",
  EEG_RECORD_BY_ID: (id: string) => `/api/eeg-records/${id}`,
  EEG_RECORD_UPLOAD: "/api/eeg-records/upload",
  EEG_RECORD_STATUS: (id: string) => `/api/eeg-records/${id}/status`,
  EEG_RECORD_PREDICTION: (id: string) => `/api/eeg-records/${id}/prediction`,

  // Predictions
  PREDICTIONS: "/api/predictions",
  PREDICTION_BY_ID: (id: string) => `/api/predictions/${id}`,
};

// Token storage
export const TOKEN_KEY = "neuroscreen_token";
