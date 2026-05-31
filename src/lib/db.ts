import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: async (text: string, params?: any[]) => {
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  },
};
