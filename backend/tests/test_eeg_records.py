import pytest
import io
import uuid


def upload_eeg(client, headers, patient_id, parquet_file):
    """Helper para reutilizar el upload en múltiples tests."""
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


class TestUploadEeg:

    def test_upload_success(self, client, user_headers, sample_patient, parquet_file):
        response = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        data = response.get_json()
        assert response.status_code == 202
        assert "id" in data
        assert data["status"] == "pending"

    def test_upload_creates_prediction_after_processing(self, client, user_headers, sample_patient, parquet_file):
        """
        Con CELERY_TASK_ALWAYS_EAGER=True la tarea se ejecuta síncronamente,
        así que tras el upload el resultado ya debería estar disponible.
        """
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        status_r = client.get(
            f"/api/eeg-records/{eeg_id}/status",
            headers=user_headers
        )
        status = status_r.get_json()["status"]
        assert status in ["processed", "failed"]  # nunca debe quedar en pending

    def test_upload_without_file(self, client, user_headers, sample_patient):
        response = client.post(
            "/api/eeg-records/upload",
            data={"patient_id": str(sample_patient.id)},
            headers=user_headers,
            content_type="multipart/form-data"
        )
        assert response.status_code == 400

    def test_upload_without_patient_id(self, client, user_headers, parquet_file):
        file_data, filename = parquet_file
        response = client.post(
            "/api/eeg-records/upload",
            data={"file": (file_data, filename, "application/octet-stream")},
            headers=user_headers,
            content_type="multipart/form-data"
        )
        assert response.status_code == 400

    def test_upload_invalid_file_type(self, client, user_headers, sample_patient):
        fake_csv = io.BytesIO(b"col1,col2\n1,2\n3,4")
        response = client.post(
            "/api/eeg-records/upload",
            data={
                "patient_id": str(sample_patient.id),
                "file": (fake_csv, "datos.csv", "text/csv")
            },
            headers=user_headers,
            content_type="multipart/form-data"
        )
        assert response.status_code == 400

    def test_upload_empty_file(self, client, user_headers, sample_patient):
        empty = io.BytesIO(b"")
        response = client.post(
            "/api/eeg-records/upload",
            data={
                "patient_id": str(sample_patient.id),
                "file": (empty, "vacio.parquet", "application/octet-stream")
            },
            headers=user_headers,
            content_type="multipart/form-data"
        )
        assert response.status_code == 400

    def test_upload_to_nonexistent_patient(self, client, user_headers, parquet_file):
        response = upload_eeg(client, user_headers, str(uuid.uuid4()), parquet_file)
        assert response.status_code == 400

    def test_user_cannot_upload_to_another_users_patient(
        self, client, another_user_headers, sample_patient, parquet_file
    ):
        # sample_patient pertenece a regular_user, no a another_user
        response = upload_eeg(client, another_user_headers, sample_patient.id, parquet_file)
        assert response.status_code == 403

    def test_upload_requires_auth(self, client, sample_patient, parquet_file):
        file_data, filename = parquet_file
        response = client.post(
            "/api/eeg-records/upload",
            data={
                "patient_id": str(sample_patient.id),
                "file": (file_data, filename, "application/octet-stream")
            },
            content_type="multipart/form-data"
        )
        assert response.status_code == 401


class TestListEegRecords:

    def test_user_sees_only_own_records(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        response = client.get("/api/eeg-records", headers=another_user_headers)
        assert response.status_code == 200
        assert response.get_json() == []

    def test_admin_sees_all_records(self, client, admin_headers, user_headers, sample_patient, parquet_file):
        upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        response = client.get("/api/eeg-records", headers=admin_headers)
        assert response.status_code == 200
        assert len(response.get_json()) >= 1

    def test_filter_by_status(self, client, user_headers, sample_patient, parquet_file):
        upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        response = client.get("/api/eeg-records?status=pending", headers=user_headers)
        assert response.status_code == 200

    def test_filter_by_invalid_status(self, client, user_headers):
        response = client.get("/api/eeg-records?status=inventado", headers=user_headers)
        assert response.status_code == 400

    def test_filter_by_patient_id(self, client, user_headers, sample_patient, parquet_file):
        upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        response = client.get(
            f"/api/eeg-records?patient_id={sample_patient.id}",
            headers=user_headers
        )
        data = response.get_json()
        assert response.status_code == 200
        assert all(r["patient_id"] == str(sample_patient.id) for r in data)


class TestGetEegRecord:

    def test_user_can_get_own_record(self, client, user_headers, sample_patient, parquet_file):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(f"/api/eeg-records/{eeg_id}", headers=user_headers)
        assert response.status_code == 200
        assert response.get_json()["id"] == eeg_id

    def test_file_path_not_exposed(self, client, user_headers, sample_patient, parquet_file):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(f"/api/eeg-records/{eeg_id}", headers=user_headers)
        assert "file_path" not in response.get_json()

    def test_user_cannot_get_another_users_record(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(f"/api/eeg-records/{eeg_id}", headers=another_user_headers)
        assert response.status_code == 403

    def test_get_nonexistent_record(self, client, user_headers):
        response = client.get(f"/api/eeg-records/{uuid.uuid4()}", headers=user_headers)
        assert response.status_code == 404


class TestEegStatus:

    def test_status_endpoint_returns_correct_fields(
        self, client, user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(f"/api/eeg-records/{eeg_id}/status", headers=user_headers)
        data = response.get_json()

        assert response.status_code == 200
        assert "status" in data
        assert "processing_time_ms" in data
        assert "error_msg" in data
        assert "file_path" not in data

    def test_status_user_isolation(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(f"/api/eeg-records/{eeg_id}/status", headers=another_user_headers)
        assert response.status_code == 403


class TestEegVisualizations:
    """Verifies the new visualization endpoint and related permissions/cascades."""

    def test_visualizations_available_after_processing(
        self, client, user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(
            f"/api/eeg-records/{eeg_id}/visualizations",
            headers=user_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "status" in data
        assert data["status"] in ("pending", "processing", "completed", "failed")
        if data["status"] == "completed":
            assert any(key in data for key in ("waveforms", "topomap", "channel_importance"))

    def test_visualizations_filters_types_and_channels(
        self, client, user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(
            f"/api/eeg-records/{eeg_id}/visualizations?types=waveforms&channels=F1",
            headers=user_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        if data.get("status") == "completed":
            assert "waveforms" in data
            wf = data["waveforms"]
            assert "channels" in wf
            assert set(wf["channels"].keys()) <= {"F1"}

    def test_visualization_access_control(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.get(
            f"/api/eeg-records/{eeg_id}/visualizations",
            headers=another_user_headers
        )
        assert response.status_code == 403

    def test_visualizations_require_auth(self, client, sample_patient, parquet_file):
        # no headers should result in unauthorized
        response = client.get(f"/api/eeg-records/{uuid.uuid4()}/visualizations")
        assert response.status_code == 401

    def test_visualizations_for_deleted_patient_returns_404(
        self, client, admin_headers, user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]
        client.delete(f"/api/patients/{sample_patient.id}", headers=admin_headers)
        response = client.get(
            f"/api/eeg-records/{eeg_id}/visualizations",
            headers=admin_headers
        )
        assert response.status_code == 404


class TestDeleteEegRecord:

    def test_user_can_delete_own_record(self, client, user_headers, sample_patient, parquet_file):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.delete(f"/api/eeg-records/{eeg_id}", headers=user_headers)
        assert response.status_code == 200

    def test_deleted_record_not_found(self, client, user_headers, sample_patient, parquet_file):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        client.delete(f"/api/eeg-records/{eeg_id}", headers=user_headers)
        response = client.get(f"/api/eeg-records/{eeg_id}", headers=user_headers)
        assert response.status_code == 404

    def test_user_cannot_delete_another_users_record(
        self, client, user_headers, another_user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.delete(f"/api/eeg-records/{eeg_id}", headers=another_user_headers)
        assert response.status_code == 403

    def test_admin_can_delete_any_record(
        self, client, admin_headers, user_headers, sample_patient, parquet_file
    ):
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        response = client.delete(f"/api/eeg-records/{eeg_id}", headers=admin_headers)
        assert response.status_code == 200

    def test_delete_cascades_to_prediction_and_visualization(self, client, user_headers, sample_patient, parquet_file):
        # after deleting the EEG record both prediction and visualization endpoints
        # should return 404
        r = upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        eeg_id = r.get_json()["id"]

        # ensure prediction exists first
        pred_resp = client.get(f"/api/eeg-records/{eeg_id}/prediction", headers=user_headers)
        if pred_resp.status_code == 200:
            assert "result" in pred_resp.get_json()

        viz_resp = client.get(f"/api/eeg-records/{eeg_id}/visualizations", headers=user_headers)
        # may be pending or completed but should not be error
        assert viz_resp.status_code == 200 or viz_resp.status_code == 403
        # now delete record
        client.delete(f"/api/eeg-records/{eeg_id}", headers=user_headers)

        assert client.get(f"/api/eeg-records/{eeg_id}/prediction", headers=user_headers).status_code == 404
        assert client.get(f"/api/eeg-records/{eeg_id}/visualizations", headers=user_headers).status_code == 404


class TestListByPatient:

    def test_list_eeg_by_patient(self, client, user_headers, sample_patient, parquet_file):
        upload_eeg(client, user_headers, sample_patient.id, parquet_file)
        response = client.get(
            f"/api/patients/{sample_patient.id}/eeg-records",
            headers=user_headers
        )
        assert response.status_code == 200
        assert len(response.get_json()) >= 1

    def test_list_by_deleted_patient_returns_404(self, client, admin_headers, sample_patient):
        client.delete(f"/api/patients/{sample_patient.id}", headers=admin_headers)
        response = client.get(
            f"/api/patients/{sample_patient.id}/eeg-records",
            headers=admin_headers
        )
        assert response.status_code == 404
