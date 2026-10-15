export default function TrendChart({ labels, series, unit, title }) {
  const values = series.flatMap(line => line.values).filter(value => typeof value === 'number' && Number.isFinite(value));
  if (!values.length) return <p className="chart-empty">Registra datos para ver el gráfico.</p>;
  const low = Math.min(...values), high = Math.max(...values), padding = Math.max((high - low) * .15, .5);
  const min = Math.max(0, low - padding), max = high + padding;
  const x = index => labels.length === 1 ? 180 : 44 + index / (labels.length - 1) * 274;
  const y = value => 136 - (value - min) / (max - min) * 104;
  const format = value => Number(value.toFixed(2)).toLocaleString('es-CL');
  return <div className="trend-chart"><svg viewBox="0 0 340 177" role="img" aria-label={title}>
    <path d="M44 25V136H320M44 84H320M44 32H320" fill="none" stroke="#474747" strokeWidth="1" />
    <text x="2" y="35">{format(max)}</text><text x="2" y="138">{format(min)}</text>
    {series.map(line => <g key={line.name}>{line.values.map((value, index) => typeof value === 'number' && <g key={index}>{index > 0 && typeof line.values[index - 1] === 'number' && <path d={`M${x(index - 1)} ${y(line.values[index - 1])}L${x(index)} ${y(value)}`} stroke={line.color} strokeWidth="2" strokeDasharray={line.dashed ? '5 4' : undefined} />}<circle cx={x(index)} cy={y(value)} r="3.5" fill={line.color}><title>{labels[index]} · {line.name}: {format(value)} {unit}</title></circle></g>)}</g>)}
    {labels.map((label, index) => (labels.length <= 7 || index === 0 || index === labels.length - 1) && <text key={index} x={x(index)} y="159" textAnchor="middle">{label}</text>)}
  </svg><div className="chart-legend">{series.map(line => <span key={line.name}><i style={{ background: line.color }} />{line.name}</span>)}<span>{unit}</span></div></div>;
}
