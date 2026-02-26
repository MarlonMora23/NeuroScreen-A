/**
 * Patient Service
 * Servicio para manejar pacientes
 */

import { httpClient } from "./http-client";
import { API_ENDPOINTS } from "@/config/api";

export interface Patient {
  id: string;
  identification_number: string;
  first_name: string;
  last_name: string;
  created_by?: string;
  birth_date?: string;
  created_at?: string;
}

export interface CreatePatientRequest {
  identification_number: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

class PatientService {
  async getPatients(filters?: {
    identification_number?: string;
    first_name?: string;
    last_name?: string;
    has_eeg_records?: boolean;
    has_pending_eeg?: boolean;
  }): Promise<Patient[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const endpoint = query ? `${API_ENDPOINTS.PATIENTS}?${query}` : API_ENDPOINTS.PATIENTS;
    return httpClient.get<Patient[]>(endpoint);
  }

  async getPatient(id: string): Promise<Patient> {
    return httpClient.get<Patient>(API_ENDPOINTS.PATIENT_BY_ID(id));
  }

  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    return httpClient.post<Patient>(API_ENDPOINTS.PATIENTS, data);
  }

  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> {
    return httpClient.put<Patient>(API_ENDPOINTS.PATIENT_BY_ID(id), data);
  }

  async deletePatient(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.PATIENT_BY_ID(id));
  }
}

export const patientService = new PatientService();
