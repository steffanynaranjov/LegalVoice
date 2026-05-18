# legalvoice-backend/tests/conftest.py
import pytest
from unittest.mock import patch, MagicMock

MOCK_USER_ID = "00000000-0000-0000-0000-000000000123"

@pytest.fixture(autouse=True)
def mock_supabase_create_client():
    """Previene que database.py intente conectarse con credenciales de placeholder."""
    mock_client = MagicMock()
    with patch("supabase.create_client", return_value=mock_client):
        yield mock_client

@pytest.fixture
def mock_auth():
    """Mockea la validación JWT de Supabase para retornar MOCK_USER_ID."""
    with patch("app.core.security.supabase") as mock:
        mock_user = MagicMock()
        mock_user.user.id = MOCK_USER_ID
        mock.auth.get_user.return_value = mock_user
        yield mock

@pytest.fixture
def client(mock_auth):
    """TestClient de FastAPI con auth mockeada."""
    from app.main import app
    from fastapi.testclient import TestClient
    return TestClient(app)

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token-valid"}
