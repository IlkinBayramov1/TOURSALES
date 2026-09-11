import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import './RevenueChart.css';

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data?: MonthlyData[];
}

const DEFAULT_DATA = [
  { month: '1 Apr', revenue: 450, bookings: 12 },
  { month: '5 Apr', revenue: 800, bookings: 24 },
  { month: '10 Apr', revenue: 600, bookings: 18 },
  { month: '15 Apr', revenue: 1200, bookings: 36 },
  { month: '20 Apr', revenue: 1450, bookings: 42 },
  { month: '25 Apr', revenue: 1100, bookings: 30 },
  { month: '30 Apr', revenue: 1800, bookings: 55 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="vendor-chart-custom-tooltip">
        <span className="tooltip-label">{label}</span>
        <strong className="tooltip-value">{payload[0].value?.toLocaleString()} ₼</strong>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;

  return (
    <div className="vendor-revenue-chart-card">
      <div className="vendor-chart-card-header">
        <div>
          <h3 className="vendor-chart-card-title">Gəlir Dinamikası</h3>
          <p className="vendor-chart-card-subtitle">Real-time satış və rezervasiya qrafiki (AZN)</p>
        </div>
        <button type="button" className="vendor-chart-btn-icon" aria-label="Seçimlər">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="vendor-recharts-container">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="vendorColorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#635bff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}₼`}
            />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#635bff"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#vendorColorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
