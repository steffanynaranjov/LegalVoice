# legalvoice-backend/tests/test_security.py
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

def test_valid_token_returns_user_id():
    with patch("app.core.security.supabase") as mock_sb:
        mock_user = MagicMock()
        mock_user.user.id = "user-abc-123"
        mock_sb.auth.get_user.return_value = mock_user

        import asyncio
        from app.core.security import get_current_user_id
        result = asyncio.run(get_current_user_id("Bearer valid-token"))
        assert result == "user-abc-123"

def test_missing_bearer_raises_401():
    import asyncio
    from app.core.security import get_current_user_id
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_current_user_id("invalid-token"))
    assert exc.value.status_code == 401

def test_invalid_token_raises_401():
    with patch("app.core.security.supabase") as mock_sb:
        mock_sb.auth.get_user.side_effect = Exception("invalid")
        import asyncio
        from app.core.security import get_current_user_id
        with pytest.raises(HTTPException) as exc:
            asyncio.run(get_current_user_id("Bearer bad-token"))
        assert exc.value.status_code == 401
