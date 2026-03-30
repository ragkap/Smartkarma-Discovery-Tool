import pool, { BASE_CTE } from './_db.js';

export default async function handler(req, res) {
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
    res.status(500).json({ error: err.message });
  }
}
