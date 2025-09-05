import os
from typing import List, Dict, Any

try:
    from supabase import create_client, Client
except ModuleNotFoundError as exc:
    raise SystemExit("Supabase client is required. Install with 'pip install supabase'.") from exc


def _dedup_records(records: List[Dict[str, Any]], key: str) -> List[Dict[str, Any]]:
    """Return records unique on the provided key."""
    seen = set()
    unique = []
    for rec in records:
        value = rec.get(key)
        if value not in seen:
            seen.add(value)
            unique.append(rec)
    return unique


def add_unique_constraint(client: Client) -> None:
    """Ensure a UNIQUE constraint on museum_id."""
    sql = """
    ALTER TABLE IF NOT EXISTS musea
    ADD CONSTRAINT IF NOT EXISTS musea_museum_id_key UNIQUE (museum_id);
    """
    try:
        client.postgrest.rpc("exec_sql", {"sql": sql}).execute()
    except Exception:
        # Ignore failures; constraint may already exist or RPC unavailable
        pass


def main() -> None:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

    client = create_client(url, key)

    response = client.table("musea").select("*").execute()
    records = response.data
    unique_records = _dedup_records(records, "museum_id")

    # Replace table contents with unique records
    client.table("musea").delete().neq("museum_id", None).execute()
    if unique_records:
        client.table("musea").insert(unique_records).execute()

    add_unique_constraint(client)


if __name__ == "__main__":
    main()
