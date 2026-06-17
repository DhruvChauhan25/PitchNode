import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_client: Client | None = None


def get_supabase() -> Client:
    """Returns a singleton Supabase client. Raises clearly if env vars are missing."""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_KEY not set. Copy .env.example to .env and fill in your project credentials."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client
