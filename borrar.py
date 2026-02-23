"""
Script de validación manual del flujo de predicción EEG.
Uso: python validate_prediction.py
"""

import os
import io
import json
import time
from werkzeug.security import generate_password_hash
from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models.user import User, UserRole
from app.models.patient import Patient

# ------------------------------------------------------------------ #
# CONFIGURA AQUÍ TU ARCHIVO Y PACIENTE                                #
# ------------------------------------------------------------------ #

PARQUET_FILE_PATH = r"C:\Users\Marlon\Downloads\co2c0000396.parquet"
PATIENT_ID = 1  # Se creará automáticamente con este ID si no existe

# ------------------------------------------------------------------ #

def load_parquet(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Archivo no encontrado: {path}")
    with open(path, "rb") as f:
        data = f.read()
    filename = os.path.basename(path)
    return (io.BytesIO(data), filename)


def upload_eeg(client, headers, patient_id, parquet_file):
    file_data, filename = parquet_file
    return client.post(
        "/api/eeg-records/upload",
        data={
            "patient_id": str(patient_id),
            "file": (file_data, filename, "application/octet-stream")
        },
        headers=headers,
        content_type="multipart/form-data"
    )


def get_token(client, email, password):
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    data = response.get_json()
    if response.status_code != 200:
        raise RuntimeError(f"Login fallido: {data}")
    return data["access_token"]


def seed_db(db):
    """Crea usuario y paciente de prueba si no existen."""
    user = User.query.filter_by(email="doctor@neuroscreen.com").first()
    if not user:
        user = User(
            email="doctor@neuroscreen.com",
            password_hash=generate_password_hash("Doctor123"),
            first_name="Juan",
            last_name="García",
            role=UserRole.USER,
        )
        db.session.add(user)
        db.session.commit()
        print(f"  Usuario creado (id={user.id})")
    else:
        print(f"  Usuario existente (id={user.id})")

    patient = Patient.query.filter_by(created_by=user.id).first()
    if not patient:
        patient = Patient(
            identification_number="TEST-001",
            first_name="Paciente",
            last_name="Prueba",
            created_by=user.id,
        )
        db.session.add(patient)
        db.session.commit()
        print(f"  Paciente creado (id={patient.id})")
    else:
        print(f"  Paciente existente (id={patient.id})")

    return user, patient


def main():
    print("\n=== VALIDACIÓN MANUAL DE PREDICCIÓN EEG ===\n")

    app = create_app(TestingConfig)

    with app.app_context():
        db.create_all()

        print("[1/5] Preparando BD...")
        user, patient = seed_db(db)

        with app.test_client() as client:
            print("[2/5] Autenticando usuario...")
            token = get_token(client, "doctor@neuroscreen.com", "Doctor123")
            headers = {"Authorization": f"Bearer {token}"}
            print(f"  Token obtenido")

            print(f"[3/5] Cargando archivo: {PARQUET_FILE_PATH}")
            parquet = load_parquet(PARQUET_FILE_PATH)
            print(f"  Archivo cargado: {parquet[1]}")

            print(f"[4/5] Enviando EEG (patient_id={patient.id})...")
            upload_r = upload_eeg(client, headers, patient.id, parquet)

            if upload_r.status_code != 202:
                print(f"\n  ERROR en upload ({upload_r.status_code}):")
                print(json.dumps(upload_r.get_json(), indent=2))
                return

            eeg_id = upload_r.get_json()["eeg_record_id"]
            print(f"  EEG registrado (id={eeg_id})")

            print("[5/5] Consultando resultado...")

            # Con TestingConfig Celery es síncrono, pero por si acaso hacemos polling
            for attempt in range(10):
                status_r = client.get(
                    f"/api/eeg-records/{eeg_id}/status",
                    headers=headers
                )
                status = status_r.get_json()["status"]

                if status in ["processed", "failed"]:
                    break

                print(f"  Estado: {status} — esperando...")
                time.sleep(2)

            print(f"\n  Estado final: {status}")

            if status == "processed":
                pred_r = client.get(
                    f"/api/eeg-records/{eeg_id}/prediction",
                    headers=headers
                )
                print("\n=== RESULTADO DE PREDICCIÓN ===")
                print(json.dumps(pred_r.get_json(), indent=2, ensure_ascii=False))

            elif status == "failed":
                error = status_r.get_json().get("error_msg")
                print(f"\n  Procesamiento fallido: {error}")

        db.drop_all()

    print("\n=== FIN ===\n")


if __name__ == "__main__":
    main()

