require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const BASE_CTE = `
  WITH base AS (
    SELECT
      e.pretty_name || ' (' || e.bloomberg_ticker || ')' AS entity,
      e.market_cap,
      e.country,
      e.sector,
      e.slug,
      COUNT(DISTINCT act.owner_id) AS distinct_searches,
      COUNT(DISTINCT act.id) AS total_searches
    FROM activities act
    INNER JOIN entities e ON e.id = act.trackable_id AND e.is_macro = 'f'
    LEFT OUTER JOIN insights i
      ON i.primary_entity_id = e.id
      AND i.published_at > NOW() - INTERVAL '3 months'
    WHERE act.key = 'entity.view'
      AND act.created_at > NOW() - INTERVAL '7 days'
      AND act.owner_id IN (
        SELECT id FROM accounts a
        WHERE (a.is_client OR a.is_individual_pass)
          AND a.activated
          AND company_id != 1
      )
    GROUP BY e.pretty_name, e.bloomberg_ticker, e.market_cap, e.country, e.sector, e.slug
    HAVING COUNT(DISTINCT i.id) = 0 AND COUNT(DISTINCT act.owner_id) > 1
  )
`;

app.get('/api/filters', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/data', async (req, res) => {
  const { country, sector, market_cap_min, page = 1, sort_col = 'distinct_searches', sort_dir = 'desc' } = req.query;
  const perPage = 25;
  const offset = (parseInt(page) - 1) * perPage;

  const allowed = { distinct_searches: true, total_searches: true, market_cap: true, entity: true };
  const col = allowed[sort_col] ? sort_col : 'distinct_searches';
  const dir = sort_dir === 'asc' ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (country) { conditions.push(`country = $${params.length + 1}`); params.push(country); }
  if (sector) { conditions.push(`sector = $${params.length + 1}`); params.push(sector); }
  if (market_cap_min) { conditions.push(`market_cap >= $${params.length + 1}`); params.push(parseFloat(market_cap_min)); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const countQuery = `${BASE_CTE} SELECT COUNT(*) FROM base ${where}`;
    const dataQuery = `${BASE_CTE} SELECT * FROM base ${where} ORDER BY ${col} ${dir} LIMIT ${perPage} OFFSET ${offset}`;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, params),
    ]);

    res.json({
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      per_page: perPage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/charts', async (req, res) => {
  try {
    const query = `
      ${BASE_CTE}
      SELECT
        country,
        sector,
        SUM(distinct_searches) AS searches
      FROM base
      WHERE country IS NOT NULL AND sector IS NOT NULL
      GROUP BY country, sector
    `;
    const result = await pool.query(query);
    const rows = result.rows;

    // Aggregate by country
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
