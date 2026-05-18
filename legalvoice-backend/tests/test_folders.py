from unittest.mock import patch
from tests.conftest import MOCK_USER_ID

MOCK_FOLDER = {
    "id": "22222222-2222-2222-2222-222222222222",
    "user_id": MOCK_USER_ID,
    "name": "Caso García",
    "client_name": "García e Hijos",
    "color": "#4a6741",
}

def test_list_folders_empty(client, auth_headers):
    with patch("app.api.routes.folders.supabase") as mock_sb:
        mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        response = client.get("/api/v1/folders/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_create_folder(client, auth_headers):
    with patch("app.api.routes.folders.supabase") as mock_sb:
        mock_sb.table.return_value.insert.return_value.execute.return_value.data = [MOCK_FOLDER]
        response = client.post(
            "/api/v1/folders/",
            json={"name": "Caso García", "client_name": "García e Hijos"},
            headers=auth_headers,
        )
    assert response.status_code == 201
    assert response.json()["name"] == "Caso García"

def test_delete_folder(client, auth_headers):
    with patch("app.api.routes.folders.supabase") as mock_sb:
        mock_sb.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = None
        response = client.delete(
            f"/api/v1/folders/{MOCK_FOLDER['id']}",
            headers=auth_headers,
        )
    assert response.status_code == 204
