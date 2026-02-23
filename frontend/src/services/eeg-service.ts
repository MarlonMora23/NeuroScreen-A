/**
 * EEG Service
 * Servicio para manejar registros EEG
 */

import { parse } from "path";
import { httpClient } from "./http-client";
import { API_ENDPOINTS } from "@/config/api";

export interface EEGRecord {
  id: string;
  patient_id: string;
  uploader_id: string;
  file_name: string;
  file_type: "parquet" | "csv" | "json" | "edf";
  file_size_bytes: number;
  status: "pending" | "processing" | "processed" | "failed";
  error_msg?: string;
  processing_time_ms?: number;
  created_at?: string;
}

export interface EEGStatus {
  id: string;
  status: "pending" | "processing" | "processed" | "failed";
  progress?: number;
  error_message?: string;
}

export interface PredictionResult {
  id: string;
  eeg_record_id: string;
  result: "alcoholic" | "non_alcoholic";
  confidence: number;
  raw_probability?: number;
  model_version: string;
  created_at?: string;
}

export interface UploadEEGInput {
  patient_id: string;
  uploader_id: string;
}

class EEGService {
  async getEEGRecords(filters?: {
    patient_id?: string;
    status?: string;
  }): Promise<EEGRecord[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.EEG_RECORDS}?${query}`
      : API_ENDPOINTS.EEG_RECORDS;
    return httpClient.get<EEGRecord[]>(endpoint);
  }

  async getEEGRecord(id: string): Promise<EEGRecord> {
    return httpClient.get<EEGRecord>(API_ENDPOINTS.EEG_RECORD_BY_ID(id));
  }

  async uploadEEG(file: File, data: UploadEEGInput): Promise<EEGRecord> {
    const fileType = this.getFileType(file.name);

    return httpClient.uploadFile<EEGRecord>(
      API_ENDPOINTS.EEG_RECORD_UPLOAD,
      file,
      {
        patient_id: data.patient_id,
        uploader_id: data.uploader_id,
        file_name: file.name,
        file_type: fileType,
        file_size_bytes: file.size.toString(),
      },
    );
  }

  private getFileType(filename: string): "parquet" | "csv" | "json" | "edf" {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "parquet":
        return "parquet";
      case "csv":
        return "csv";
      case "json":
        return "json";
      case "edf":
        return "edf";
      default:
        return "csv"; // Default fallback
    }
  }

  async getEEGStatus(id: string): Promise<EEGStatus> {
    return httpClient.get<EEGStatus>(API_ENDPOINTS.EEG_RECORD_STATUS(id));
  }

  async getEEGPrediction(id: string): Promise<PredictionResult> {
    return httpClient.get<PredictionResult>(
      API_ENDPOINTS.EEG_RECORD_PREDICTION(id),
    );
  }

  async deleteEEGRecord(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.EEG_RECORD_BY_ID(id));
  }

  async getPatientEEGRecords(patientId: string): Promise<EEGRecord[]> {
    return httpClient.get<EEGRecord[]>(
      API_ENDPOINTS.PATIENT_EEG_RECORDS(patientId),
    );
  }

  async getPatientPredictions(patientId: string): Promise<PredictionResult[]> {
    return httpClient.get<PredictionResult[]>(
      API_ENDPOINTS.PATIENT_PREDICTIONS(patientId),
    );
  }

  async getAllPredictions(): Promise<PredictionResult[]> {
    return httpClient.get<PredictionResult[]>(API_ENDPOINTS.PREDICTIONS);
  }

  /**
   * Poll the status of an EEG record with a callback for updates
   * @param eegRecordId - The ID of the EEG record to monitor
   * @param onStatusChange - Callback function when status changes
   * @param maxRetries - Maximum polling attempts (default: 120 = 10 minutes with 5s intervals)
   * @param intervalMs - Polling interval in milliseconds (default: 5000)
   * @returns Promise that resolves when processing is complete (processed or failed)
   */
  async pollEEGStatus(
    eegRecordId: string,
    onStatusChange?: (record: EEGRecord) => void,
    maxRetries: number = 120,
    intervalMs: number = 5000,
  ): Promise<EEGRecord> {
    let attempts = 0;
    let lastStatus: string | null = null;

    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const record = await this.getEEGRecord(eegRecordId);

          // Call callback only when status changes
          if (record.status !== lastStatus) {
            lastStatus = record.status;
            onStatusChange?.(record);
          }

          // Check if processing is complete
          if (record.status === "processed" || record.status === "failed") {
            clearInterval(pollInterval);
            resolve(record);
          }

          // Max retries exceeded
          if (attempts >= maxRetries) {
            clearInterval(pollInterval);
            reject(
              new Error(
                `EEG processing timeout after ${(maxRetries * intervalMs) / 1000}s`,
              ),
            );
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, intervalMs);
    });
  }
}

export const eegService = new EEGService();
