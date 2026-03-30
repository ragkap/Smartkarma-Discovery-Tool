import { useState, useEffect, useCallback } from 'react';

const skeletonKeyframes = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
`;

function SkeletonCell({ width = '80%', height = 13 }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '600px 100%',
      animation: 'shimmer 1.4s infinite linear',
    }} />
  );
}

function SkeletonRows({ count = 25 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '11px 4px 11px 0', textAlign: 'right' }}>
        <SkeletonCell width={18} height={12} />
      </td>
      <td style={{ padding: '11px 12px' }}><SkeletonCell width={`${60 + Math.random() * 25}%`} /></td>
      <td style={{ padding: '11px 12px', textAlign: 'right' }}><SkeletonCell width={60} /></td>
      <td style={{ padding: '11px 12px' }}><SkeletonCell width={`${30 + Math.random() * 50}%`} height={14} /></td>
      <td style={{ padding: '11px 12px' }}><SkeletonCell width={`${20 + Math.random() * 60}%`} height={14} /></td>
    </tr>
  ));
}
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const API = '';
const TEAL = '#1db8a0';
const NAVY = '#1b3a6b';

const CHART_COLORS = [
  '#1db8a0', '#1a7a6e', '#9e9e9e', '#1b3a6b', '#90caf9',
  '#43a047', '#8bc34a', '#cddc39', '#00bcd4', '#1565c0',
  '#bdbdbd', '#26a69a',
];

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const TOP_N = 10;
  const top = data.slice(0, TOP_N);
  const othersVal = data.slice(TOP_N).reduce((s, d) => s + d.value, 0);
  const chartData = othersVal > 0 ? [...top, { name: 'Others', value: othersVal }] : top;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {(percent * 100).toFixed(1)}%
      </text>
    );
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
      {/* Donut — fixed size, no clipping */}
      <div style={{ flexShrink: 0, width: 260, height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={125}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              isAnimationActive={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${((value / total) * 100).toFixed(1)}%`, 'Share']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* HTML legend — never clipped */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {chartData.map((entry, i) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              background: CHART_COLORS[i % CHART_COLORS.length],
            }} />
            <span style={{ fontSize: 12, color: '#444', whiteSpace: 'nowrap' }}>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMarketCap(val) {
  if (val == null) return '';
  return '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        height: 14,
        width: `${Math.min(pct, 100)}%`,
        minWidth: pct > 0 ? 4 : 0,
        maxWidth: 220,
        background: color,
        borderRadius: 2,
      }} />
    </div>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: '1px solid #d0d0d0', borderRadius: 6,
      background: '#fff', minWidth: 180, overflow: 'hidden',
    }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, padding: '10px 12px', border: 'none', outline: 'none',
          background: 'transparent', fontSize: 14,
          color: value ? '#1a1a2e' : '#888', cursor: 'pointer', appearance: 'none',
        }}
      >
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ paddingRight: 10, color: '#888', pointerEvents: 'none' }}>▾</span>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [countries, setCountries] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [country, setCountry] = useState('');
  const [sector, setSector] = useState('');
  const [marketCapMin, setMarketCapMin] = useState('');
  const [sortCol, setSortCol] = useState('distinct_searches');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  const PER_PAGE = 25;

  useEffect(() => {
    fetch(`${API}/api/filters`)
      .then(r => r.json())
      .then(d => { setCountries(d.countries || []); setSectors(d.sectors || []); })
      .catch(() => {});
    fetch(`${API}/api/charts`)
      .then(r => r.json())
      .then(d => setChartData(d))
      .catch(() => {});
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page, sort_col: sortCol, sort_dir: sortDir });
    if (country) params.set('country', country);
    if (sector) params.set('sector', sector);
    if (marketCapMin) params.set('market_cap_min', marketCapMin);
    fetch(`${API}/api/data?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setRows([]); }
        else { setRows(d.rows); setTotal(d.total); }
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [page, sortCol, sortDir, country, sector, marketCapMin]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  };

  const maxDistinct = Math.max(...rows.map(r => Number(r.distinct_searches) || 0), 1);
  const maxTotal = Math.max(...rows.map(r => Number(r.total_searches) || 0), 1);
  const totalPages = Math.ceil(total / PER_PAGE);
  const startRow = (page - 1) * PER_PAGE + 1;
  const endRow = Math.min(page * PER_PAGE, total);

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ color: '#bbb', marginLeft: 4, fontSize: 11 }}>⇅</span>;
    return <span style={{ color: NAVY, marginLeft: 4 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const thStyle = (align = 'left') => ({
    padding: '10px 12px', textAlign: align,
    color: '#444', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    userSelect: 'none', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ maxWidth: 1135, margin: '0 auto', padding: '32px 40px' }}>
      <style>{skeletonKeyframes}</style>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0d0d1a', marginBottom: 6, fontFamily: 'inherit' }}>
          Smartkarma Discovery
        </h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Using Search data to help identify Entities of interest to users, having the fewest number of Insights published
        </p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 6 }}>
          Based on last 3 months of searches on Smartkarma
        </p>
      </div>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0d0d1a', marginBottom: 4, fontFamily: 'inherit' }}>
          Most Searched Entities
        </h2>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
          Narrow down Entities by market capitalization, country and sector where users searches have not retrieved recently published Insights
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select label="Country" options={countries} value={country}
            onChange={v => { setCountry(v); setPage(1); }} />
          <Select label="Sector" options={sectors} value={sector}
            onChange={v => { setSector(v); setPage(1); }} />
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid #d0d0d0', borderRadius: 6,
            background: '#fff', overflow: 'hidden', flex: 1, minWidth: 280,
          }}>
            <span style={{
              padding: '10px 12px', color: '#1a1a2e', fontSize: 14,
              whiteSpace: 'nowrap', borderRight: '1px solid #d0d0d0',
            }}>
              Market Cap &nbsp;&nbsp;≥ &nbsp;▾
            </span>
            <input
              type="number"
              placeholder="Enter a value"
              value={marketCapMin}
              onChange={e => { setMarketCapMin(e.target.value); setPage(1); }}
              style={{
                flex: 1, padding: '10px 12px', border: 'none', outline: 'none',
                fontSize: 14, color: '#1a1a2e', background: 'transparent',
              }}
            />
          </div>
          {(country || sector || marketCapMin) && (
            <button
              onClick={() => { setCountry(''); setSector(''); setMarketCapMin(''); setPage(1); }}
              style={{
                padding: '10px 14px', border: '1px solid #d0d0d0', borderRadius: 6,
                background: '#fff', cursor: 'pointer', fontSize: 13, color: '#666',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: 16, background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 6, color: '#c00', marginBottom: 16, fontSize: 13 }}>
            Error: {error}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e8e8e8' }}>
              <th style={{ width: 36, padding: '10px 4px 10px 0', color: '#aaa', fontWeight: 400, fontSize: 12 }}></th>
              <th style={thStyle()} onClick={() => handleSort('entity')}>
                Entity Name <SortIcon col="entity" />
              </th>
              <th style={{ ...thStyle('right'), width: 130 }} onClick={() => handleSort('market_cap')}>
                Market Cap <SortIcon col="market_cap" />
              </th>
              <th style={{ ...thStyle(), width: 260 }} onClick={() => handleSort('distinct_searches')}>
                Unique Searches <SortIcon col="distinct_searches" />
              </th>
              <th style={{ ...thStyle(), width: 260 }} onClick={() => handleSort('total_searches')}>
                Total Searches <SortIcon col="total_searches" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows count={25} />
            ) : rows.length === 0 && !error ? (
              <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: '#888' }}>No results found.</td></tr>
            ) : rows.map((row, i) => (
              <tr
                key={row.slug || i}
                style={{ borderBottom: '1px solid #f0f0f0' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '9px 4px 9px 0', color: '#aaa', fontSize: 13, textAlign: 'right' }}>
                  {startRow + i}.
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <a
                    href={`https://www.smartkarma.com/entities/${row.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#1a1a2e', textDecoration: 'underline', fontSize: 13 }}
                  >
                    {row.entity}
                  </a>
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 13, color: '#444' }}>
                  {formatMarketCap(row.market_cap)}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <Bar value={Number(row.distinct_searches)} max={maxDistinct} color={TEAL} />
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <Bar value={Number(row.total_searches)} max={maxTotal} color={NAVY} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: 10, marginTop: 20, color: '#666', fontSize: 13,
          }}>
            <span>{startRow} - {endRow} / {total}</span>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 28, height: 28, border: '1px solid #d0d0d0', borderRadius: 4,
                background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? '#ccc' : '#444', fontSize: 15,
              }}
            >‹</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 28, height: 28, border: '1px solid #d0d0d0', borderRadius: 4,
                background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                color: page === totalPages ? '#ccc' : '#444', fontSize: 15,
              }}
            >›</button>
          </div>
        )}
      </div>

      {/* Charts */}
      {chartData && (
        <div style={{ marginTop: 48, borderTop: '1px solid #eee', paddingTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0d0d1a', marginBottom: 4, fontFamily: 'inherit' }}>
            Searched Countries and Sectors
          </h2>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
            Determine how search activity on Smartkarma can be categorised by country and sector
          </p>
          <div style={{ display: 'flex', gap: 32 }}>
            <DonutChart data={chartData.countries} />
            <DonutChart data={chartData.sectors} />
          </div>
        </div>
      )}
    </div>
  );
}
