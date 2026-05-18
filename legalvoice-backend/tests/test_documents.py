# legalvoice-backend/tests/test_documents.py
from unittest.mock import patch
from tests.conftest import MOCK_USER_ID

MOCK_DOC = {
    "id": "11111111-1111-1111-1111-111111111111",
    "user_id": "00000000-0000-0000-0000-000000000123",
    "folder_id": None,
    "title": "Contrato de prueba",
    "content": {},
    "word_count": 0,
    "updated_at": "2026-05-17T00:00:00+00:00",
}

def test_list_documents_returns_empty(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        (mock_sb.table.return_value.select.return_value
         .eq.return_value.eq.return_value.order.return_value.execute
         .return_value.data) = []
        response = client.get("/api/v1/documents/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_create_document(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        mock_sb.table.return_value.insert.return_value.execute.return_value.data = [MOCK_DOC]
        response = client.post(
            "/api/v1/documents/",
            json={"title": "Contrato de prueba"},
            headers=auth_headers,
        )
    assert response.status_code == 201
    assert response.json()["title"] == "Contrato de prueba"

def test_get_document_not_found(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        (mock_sb.table.return_value.select.return_value
         .eq.return_value.eq.return_value.execute.return_value.data) = []
        response = client.get(
            "/api/v1/documents/00000000-0000-0000-0000-000000000001",
            headers=auth_headers,
        )
    assert response.status_code == 404

def test_update_document(client, auth_headers):
    updated = {**MOCK_DOC, "title": "Título actualizado", "word_count": 10}
    with patch("app.api.routes.documents.supabase") as mock_sb:
        mock_sb.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [updated]
        response = client.put(
            f"/api/v1/documents/{MOCK_DOC['id']}",
            json={"title": "Título actualizado", "word_count": 10},
            headers=auth_headers,
        )
    assert response.status_code == 200
    assert response.json()["title"] == "Título actualizado"

def test_delete_document(client, auth_headers):
    with patch("app.api.routes.documents.supabase") as mock_sb:
        mock_sb.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = None
        response = client.delete(
            f"/api/v1/documents/{MOCK_DOC['id']}",
            headers=auth_headers,
        )
    assert response.status_code == 204

def test_request_without_auth_returns_422(client):
    response = client.get("/api/v1/documents/")
    assert response.status_code == 422
