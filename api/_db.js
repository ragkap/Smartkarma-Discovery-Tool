import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

export const BASE_CTE = `
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

export default pool;
