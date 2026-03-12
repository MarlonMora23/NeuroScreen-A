/**
 * API Configuration
 * Define la URL base del backend y constantes de configuración
 */

export const API_BASE_URL = "/neuro-screen-a/api";

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",
  VALIDATE_SESSION: "/auth/validate",
  INVALIDATE_USER_SESSION: (id: string) => `/auth/users/${id}/invalidate-session`,

  // Users
  USERS: "/users",
  USER_BY_ID: (id: string) => `/users/${id}`,

  // Patients
  PATIENTS: "/patients",
  PATIENT_BY_ID: (id: string) => `/patients/${id}`,
  PATIENT_EEG_RECORDS: (id: string) => `/patients/${id}/eeg-records`,
  PATIENT_PREDICTIONS: (id: string) => `/patients/${id}/predictions`,

  // EEG Records
  EEG_RECORDS: "/eeg-records",
  EEG_RECORD_BY_ID: (id: string) => `/eeg-records/${id}`,
  EEG_RECORD_UPLOAD: "/eeg-records/upload",
  EEG_RECORD_STATUS: (id: string) => `/eeg-records/${id}/status`,
  EEG_RECORD_PREDICTION: (id: string) => `/eeg-records/${id}/prediction`,
  EEG_RECORD_VISUALIZATION: (id: string) => `/eeg-records/${id}/visualizations`,

  // Predictions
  PREDICTIONS: "/predictions",
  PREDICTION_BY_ID: (id: string) => `/predictions/${id}`,
};

// Token storage
export const TOKEN_KEY = "neuroscreen_token";
