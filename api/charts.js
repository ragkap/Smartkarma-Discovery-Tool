import pool, { BASE_CTE } from './_db.js';

export default async function handler(req, res) {
  try {
    const query = `
      ${BASE_CTE}
      SELECT country, sector, SUM(distinct_searches) AS searches
      FROM base
      WHERE country IS NOT NULL AND sector IS NOT NULL
      GROUP BY country, sector
    `;
    const result = await pool.query(query);
    const rows = result.rows;

    const countryMap = {};
    const sectorMap = {};
    for (const r of rows) {
      countryMap[r.country] = (countryMap[r.country] || 0) + Number(r.searches);
      sectorMap[r.sector] = (sectorMap[r.sector] || 0) + Number(r.searches);
    }

    const toSorted = (map) =>
      Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    res.json({ countries: toSorted(countryMap), sectors: toSorted(sectorMap) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
