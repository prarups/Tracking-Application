import psycopg2

def setup_pg():
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password='p@ssw0rd', host='localhost', port='5432')
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname='tracking'")
        exists = cur.fetchone()
        if not exists:
            cur.execute("CREATE DATABASE tracking")
            print("Created database 'tracking' on PostgreSQL!")
        else:
            print("Database 'tracking' already exists on PostgreSQL.")
        cur.close()
        conn.close()
    except Exception as e:
        print("PostgreSQL error:", e)

if __name__ == '__main__':
    setup_pg()
