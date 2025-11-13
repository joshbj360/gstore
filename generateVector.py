from sentence_transformers import SentenceTransformer
import psycopg2
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

conn = psycopg2.connect("YOUR_SUPABASE_CONNECTION_STRING")
cur = conn.cursor()

cur.execute("SELECT id, title, description FROM products;")
for product_id, title, desc in cur.fetchall():
    text = f"{title}. {desc or ''}"
    vector = model.encode(text).astype(np.float32)
    cur.execute("UPDATE products SET embedding = %s WHERE id = %s", (vector.tolist(), product_id))

conn.commit()
cur.close()
conn.close()

print("Done")