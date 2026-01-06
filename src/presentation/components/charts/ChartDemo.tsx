import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const barData = [
  { name: 'Healthy', value: 45 },
  { name: 'At Risk', value: 30 },
  { name: 'Critical', value: 15 },
];

const lineData = [
  { month: 'Jan', score: 65 },
  { month: 'Feb', score: 68 },
  { month: 'Mar', score: 72 },
  { month: 'Apr', score: 70 },
];

const pieData = [
  { name: 'Active', value: 80 },
  { name: 'Inactive', value: 20 },
];

const areaData = [
  { month: 'Jan', mrr: 12000 },
  { month: 'Feb', mrr: 14500 },
  { month: 'Mar', mrr: 16200 },
  { month: 'Apr', mrr: 18000 },
];

const COLORS = ['#22C55E', '#F59E0B', '#EF4444'];

const radialData = [{ name: 'Health Score', value: 75, fill: '#22C55E' }];

export function ChartDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Chart Components Demo</h2>

      <h3>Bar Chart - Health Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {barData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <h3>Line Chart - Score Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <h3>Area Chart - Cumulative MRR</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={areaData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="mrr" stroke="#3B82F6" fill="#93C5FD" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>

      <h3>Pie Chart - Activity Status</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            dataKey="value"
            label
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#22C55E' : '#94A3B8'} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <h3>Radial Bar Chart - Health Score Gauge</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          data={radialData}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar background dataKey="value" />
          <Legend />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
