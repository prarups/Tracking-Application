import os
import sys
from pathlib import Path

# Load .env file if present
BASE_DIR = Path(__file__).resolve().parent
_env_file = BASE_DIR / '.env'
if _env_file.exists():
    with open(_env_file, 'r', encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _v = _line.split('=', 1)
                os.environ.setdefault(_k.strip(), _v.strip())

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_pg():
    db_name = os.environ.get('DB_NAME', 'tracking')
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', '')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')

    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        import urllib.parse as urlparse
        url = urlparse.urlparse(database_url)
        db_name = url.path[1:] if url.path else db_name
        db_user = url.username or db_user
        db_password = url.password or db_password
        db_host = url.hostname or db_host
        db_port = str(url.port or db_port)

    print(f"[*] Checking PostgreSQL database '{db_name}' on {db_host}:{db_port}...")
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (db_name,))
        if not cur.fetchone():
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print(f"[+] Successfully created PostgreSQL database '{db_name}'!")
        else:
            print(f"[=] PostgreSQL database '{db_name}' already exists.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[!] PostgreSQL connection warning: {e}")
        print("    If the database is already created manually, you can proceed directly with 'python manage.py migrate'.")

if __name__ == '__main__':
    setup_pg()
