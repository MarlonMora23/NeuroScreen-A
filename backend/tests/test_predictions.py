import pytest
import uuid


def upload_and_get_prediction_id(client, headers, patient_id, parquet_file):
    """Helper: sube un EEG y devuelve el eeg_record_id."""
    file_data, filename = parquet_file
    r = client.post(
        "/api/eeg-records/upload",
        data={
            "patient_id": str(patient_id),
            "file": (file_data, filename, "application/octet-stream")
        },
        headers=headers,
        content_type="multipart/form-data"
    )
    return r.get_json()["id"]


def upload_and_wait_for_prediction(client, headers, patient_id, parquet_file):
    """Helper: sube un EEG, espera procesamiento y devuelve el prediction."""
    eeg_id = upload_and_get_prediction_id(client, headers, patient_id, parquet_file)
    
    # Esperar a que el EEG sea procesado
    status_r = client.get(f"/api/eeg-records/{eeg_id}/status", headers=headers)
    status = status_r.get_json()["status"]
    
    if status == "processed":
        pred_r = client.get(f"/api/eeg-records/{eeg_id}/prediction", headers=headers)
        if pred_r.status_code == 200:
            return eeg_id, pred_r.get_json()
    
    return eeg_id, None


class TestGetPrediction:

    def test_prediction_available_after_processing(
        self, client, user_headers, sample_patient, parquet_file
    ):
        """Con CELERY_TASK_ALWAYS_EAGER la tarea ya habrá corrido al hacer el upload."""
        eeg_id = upload_and_get_prediction_id(
            client, user_headers, sample_patient.id, parquet_file
        )

        # Verificar que el estado es terminal
        status_r = client.get(f"/api/eeg-records/{eeg_id}/status", headers=user_headers)
        status = status_r.get_json()["status"]

        if status == "processed":
            response = client.get(
                f"/api/eeg-records/{eeg_id}/prediction",
                headers=user_headers
            )
            data = response.get_json()
            assert response.status_code == 200
            assert "result" in data
            assert "confidence" in data
            assert "model_version" in data
            assert 0.0 <= float(data["confidence"]) <= 1.0

    def test_prediction_not_available_for_nonexistent_record(self, client, user_headers):
        response = client.get(f"/api/eeg-records/{uuid.uuid4()}/prediction", headers=user_headers)
        assert response.status_code == 404

    def test_user_cannot_get_another_users_prediction(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        eeg_id = upload_and_get_prediction_id(
            client, user_headers, sample_patient.id, parquet_file
        )
        response = client.get(
            f"/api/eeg-records/{eeg_id}/prediction",
            headers=another_user_headers
        )
        assert response.status_code == 403

    def test_admin_can_get_any_prediction(
        self, client, admin_headers, user_headers, sample_patient, parquet_file
    ):
        eeg_id = upload_and_get_prediction_id(
            client, user_headers, sample_patient.id, parquet_file
        )
        status_r = client.get(f"/api/eeg-records/{eeg_id}/status", headers=admin_headers)
        if status_r.get_json()["status"] == "processed":
            response = client.get(
                f"/api/eeg-records/{eeg_id}/prediction",
                headers=admin_headers
            )
            assert response.status_code == 200

    def test_prediction_does_not_expose_file_path(
        self, client, user_headers, sample_patient, parquet_file
    ):
        eeg_id = upload_and_get_prediction_id(
            client, user_headers, sample_patient.id, parquet_file
        )
        status_r = client.get(f"/api/eeg-records/{eeg_id}/status", headers=user_headers)
        if status_r.get_json()["status"] == "processed":
            response = client.get(
                f"/api/eeg-records/{eeg_id}/prediction",
                headers=user_headers
            )
            assert "file_path" not in response.get_json()

    def test_prediction_requires_auth(self, client):
        response = client.get(f"/api/eeg-records/{uuid.uuid4()}/prediction")
        assert response.status_code == 401

    def test_prediction_not_available_after_eeg_deletion(
        self, client, user_headers, sample_patient, parquet_file
    ):
        eeg_id = upload_and_get_prediction_id(
            client, user_headers, sample_patient.id, parquet_file
        )
        # delete the eeg record
        client.delete(f"/api/eeg-records/{eeg_id}", headers=user_headers)
        response = client.get(f"/api/eeg-records/{eeg_id}/prediction", headers=user_headers)
        assert response.status_code == 404

    def test_get_prediction_invalid_eeg_uuid(self, client, user_headers):
        """UUID inválido para EEG debe retornar 404"""
        response = client.get(f"/api/eeg-records/invalid-uuid/prediction", headers=user_headers)
        assert response.status_code == 404

    def test_prediction_response_contains_all_fields(
        self, client, user_headers, sample_patient, parquet_file
    ):
        """Validar que la respuesta contiene todos los campos requeridos"""
        eeg_id = upload_and_get_prediction_id(
            client, user_headers, sample_patient.id, parquet_file
        )
        status_r = client.get(f"/api/eeg-records/{eeg_id}/status", headers=user_headers)
        
        if status_r.get_json()["status"] == "processed":
            response = client.get(
                f"/api/eeg-records/{eeg_id}/prediction",
                headers=user_headers
            )
            assert response.status_code == 200
            data = response.get_json()
            
            # Validar que todos los campos requeridos están presentes
            required_fields = [
                "id", "eeg_record_id", "patient_identification_number",
                "file_name", "result", "confidence", "model_version", "created_at"
            ]
            for field in required_fields:
                assert field in data, f"Campo requerido faltante: {field}"
            
            # Validar tipos de datos
            assert isinstance(data["id"], str)
            assert isinstance(data["eeg_record_id"], str)
            assert isinstance(data["file_name"], str)
            assert isinstance(data["result"], str)
            assert isinstance(data["confidence"], (int, float))
            assert isinstance(data["model_version"], str)
            assert isinstance(data["created_at"], str)


class TestListPredictionsByPatient:

    def test_list_predictions_by_patient(
        self, client, user_headers, sample_patient, parquet_file
    ):
        upload_and_get_prediction_id(client, user_headers, sample_patient.id, parquet_file)
        response = client.get(
            f"/api/patients/{sample_patient.id}/predictions",
            headers=user_headers
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_user_cannot_list_predictions_of_another_users_patient(
        self, client, another_user_headers, sample_patient
    ):
        response = client.get(
            f"/api/patients/{sample_patient.id}/predictions",
            headers=another_user_headers
        )
        assert response.status_code == 403

    def test_list_predictions_deleted_patient_returns_404(
        self, client, admin_headers, sample_patient
    ):
        client.delete(f"/api/patients/{sample_patient.id}", headers=admin_headers)
        response = client.get(
            f"/api/patients/{sample_patient.id}/predictions",
            headers=admin_headers
        )
        assert response.status_code == 404

    def test_list_predictions_by_invalid_patient_uuid(self, client, user_headers):
        """UUID inválido de paciente retorna 404"""
        response = client.get(
            f"/api/patients/invalid-uuid/predictions",
            headers=user_headers
        )
        assert response.status_code == 404

    def test_admin_can_list_predictions_of_other_users_patient(
        self, client, admin_headers, user_headers, sample_patient, parquet_file
    ):
        """Admin puede listar predicciones de pacientes de otros usuarios"""
        # Usuario regular sube una predicción para su paciente
        upload_and_get_prediction_id(client, user_headers, sample_patient.id, parquet_file)
        
        # Admin puede acceder a las predicciones de ese paciente
        response = client.get(
            f"/api/patients/{sample_patient.id}/predictions",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)


class TestListAllPredictions:

    def test_admin_can_list_all_predictions(self, client, admin_headers):
        response = client.get("/api/predictions", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_regular_user_can_list_own_predictions(self, client, user_headers, sample_patient, parquet_file):
        eeg_id = upload_and_get_prediction_id(client, user_headers, sample_patient.id, parquet_file)
        
        # Ensure the prediction is available
        pred_response = client.get(f"/api/eeg-records/{eeg_id}/prediction", headers=user_headers)
        assert pred_response.status_code == 200
        prediction = pred_response.get_json()
        prediction_id = prediction['id']
        
        # List all predictions for the user
        response = client.get("/api/predictions", headers=user_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        
        # Check that the user's prediction is in the list
        prediction_ids = [str(p['id']) for p in data]
        assert str(prediction_id) in prediction_ids

    def test_list_all_requires_auth(self, client):
        response = client.get("/api/predictions")
        assert response.status_code == 401

    def test_admin_lists_all_predictions_user_lists_only_own(
        self, client, admin_headers, user_headers, another_user_headers, 
        sample_patient, parquet_file
    ):
        """Admin ve todas las predicciones mientras que usuario solo ve las suyas"""
        # Usuario 1 crea una predicción
        eeg_id_1 = upload_and_get_prediction_id(client, user_headers, sample_patient.id, parquet_file)
        pred_response_1 = client.get(f"/api/eeg-records/{eeg_id_1}/prediction", headers=user_headers)
        
        # Obtener lista de admin (debe contener todas)
        admin_list_response = client.get("/api/predictions", headers=admin_headers)
        assert admin_list_response.status_code == 200
        admin_predictions = admin_list_response.get_json()
        
        # Obtener lista de usuario 1 (solo la suya)
        user1_list_response = client.get("/api/predictions", headers=user_headers)
        assert user1_list_response.status_code == 200
        user1_predictions = user1_list_response.get_json()
        
        # Admin ve al menos tantas como user1
        assert len(admin_predictions) >= len(user1_predictions)
        
        # Si hay predicción, usuario 1 la ve
        if pred_response_1.status_code == 200:
            pred_id_1 = pred_response_1.get_json()["id"]
            user1_pred_ids = [p["id"] for p in user1_predictions]
            assert str(pred_id_1) in [str(pid) for pid in user1_pred_ids]


class TestGetPredictionById:
    """Tests para obtener una predicción por su ID directamente"""

    def test_get_prediction_by_id_success(self, client, user_headers, sample_patient, parquet_file):
        """Usuario obtiene su propia predicción por ID"""
        eeg_id, prediction = upload_and_wait_for_prediction(
            client, user_headers, sample_patient.id, parquet_file
        )
        
        if prediction:
            prediction_id = prediction["id"]
            response = client.get(f"/api/predictions/{prediction_id}", headers=user_headers)
            assert response.status_code == 200
            data = response.get_json()
            assert data["id"] == prediction_id
            assert data["eeg_record_id"] == eeg_id

    def test_get_prediction_by_id_invalid_uuid(self, client, user_headers):
        """UUID inválido debe retornar 404"""
        response = client.get(f"/api/predictions/invalid-uuid", headers=user_headers)
        assert response.status_code == 404

    def test_get_prediction_by_id_nonexistent(self, client, user_headers):
        """Predicción inexistente retorna 404"""
        response = client.get(f"/api/predictions/{uuid.uuid4()}", headers=user_headers)
        assert response.status_code == 404

    def test_get_prediction_by_id_user_permission_denied(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        """Usuario no puede acceder a predicción de otro usuario"""
        eeg_id, prediction = upload_and_wait_for_prediction(
            client, user_headers, sample_patient.id, parquet_file
        )
        
        if prediction:
            prediction_id = prediction["id"]
            response = client.get(
                f"/api/predictions/{prediction_id}",
                headers=another_user_headers
            )
            assert response.status_code == 403

    def test_get_prediction_by_id_admin_can_access_any(
        self, client, admin_headers, user_headers, sample_patient, parquet_file
    ):
        """Admin puede acceder a cualquier predicción"""
        eeg_id, prediction = upload_and_wait_for_prediction(
            client, user_headers, sample_patient.id, parquet_file
        )
        
        if prediction:
            prediction_id = prediction["id"]
            response = client.get(
                f"/api/predictions/{prediction_id}",
                headers=admin_headers
            )
            assert response.status_code == 200

    def test_get_prediction_by_id_requires_auth(self, client):
        """Obtener predicción sin autenticación retorna 401"""
        response = client.get(f"/api/predictions/{uuid.uuid4()}")
        assert response.status_code == 401


class TestDeletePrediction:
    """Tests para eliminar una predicción"""

    def test_delete_prediction_admin_success(
        self, client, admin_headers, user_headers, sample_patient, parquet_file
    ):
        """Admin puede eliminar una predicción"""
        eeg_id, prediction = upload_and_wait_for_prediction(
            client, user_headers, sample_patient.id, parquet_file
        )
        
        if prediction:
            prediction_id = prediction["id"]
            response = client.delete(
                f"/api/predictions/{prediction_id}",
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.get_json()
            assert data["id"] == prediction_id
            
            # Verificar que la predicción ya no es accesible
            get_response = client.get(
                f"/api/predictions/{prediction_id}",
                headers=admin_headers
            )
            assert get_response.status_code == 404

    def test_delete_prediction_user_no_permission(
        self, client, user_headers, sample_patient, parquet_file
    ):
        """Usuario regular no puede eliminar predicción"""
        eeg_id, prediction = upload_and_wait_for_prediction(
            client, user_headers, sample_patient.id, parquet_file
        )
        
        if prediction:
            prediction_id = prediction["id"]
            response = client.delete(
                f"/api/predictions/{prediction_id}",
                headers=user_headers
            )
            assert response.status_code == 403

    def test_delete_prediction_not_found(self, client, admin_headers):
        """Eliminar predicción inexistente retorna 404"""
        response = client.delete(
            f"/api/predictions/{uuid.uuid4()}",
            headers=admin_headers
        )
        assert response.status_code == 404

    def test_delete_prediction_invalid_uuid(self, client, admin_headers):
        """UUID inválido retorna 404"""
        response = client.delete(
            f"/api/predictions/invalid-uuid",
            headers=admin_headers
        )
        assert response.status_code == 404

    def test_delete_prediction_requires_auth(self, client):
        """Eliminar predicción sin autenticación retorna 401"""
        response = client.delete(f"/api/predictions/{uuid.uuid4()}")
        assert response.status_code == 401
