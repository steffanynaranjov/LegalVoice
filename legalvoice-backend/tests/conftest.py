# legalvoice-backend/tests/conftest.py
# Mock supabase client creation before any module imports it,
# so tests work without real Supabase credentials.
from unittest.mock import MagicMock, patch

# Patch create_client at the module level so database.py doesn't fail at import
_mock_supabase_client = MagicMock()

import sys
import unittest.mock as mock

# Pre-patch supabase.create_client so that when database.py is imported,
# it gets a mock instead of trying to connect with placeholder credentials.
_patcher = mock.patch("supabase.create_client", return_value=_mock_supabase_client)
_patcher.start()
