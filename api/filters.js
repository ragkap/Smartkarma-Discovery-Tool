import pool, { BASE_CTE } from './_db.js';

export default async function handler(req, res) {
  try {
    const query = `${BASE_CTE}
      SELECT DISTINCT country, sector FROM base
      WHERE country IS NOT NULL AND sector IS NOT NULL
      ORDER BY country, sector`;
    const result = await pool.query(query);
    const countries = [...new Set(result.rows.map(r => r.country).filter(Boolean))].sort();
    const sectors = [...new Set(result.rows.map(r => r.sector).filter(Boolean))].sort();
    res.json({ countries, sectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
