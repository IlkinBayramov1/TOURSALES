import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import './SalesDistributionChart.css';

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

interface SalesDistributionChartProps {
  data?: PieEntry[];
  totalTickets?: number;
}

const DEFAULT_PIE_DATA: PieEntry[] = [
  { name: 'Xarici Turlar', value: 65, color: '#635bff' },
  { name: 'Daxili Turlar', value: 35, color: '#0ea5e9' },
];

export const SalesDistributionChart: React.FC<SalesDistributionChartProps> = ({
  data = DEFAULT_PIE_DATA,
  totalTickets = 1284,
}) => {
  return (
    <div className="vendor-pie-chart-card">
      <div className="vendor-chart-card-header">
        <h3 className="vendor-chart-card-title">Satışların Bölgüsü</h3>
        <button type="button" className="vendor-chart-btn-icon" aria-label="Seçimlər">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="vendor-pie-container-wrap">
        <div className="vendor-pie-render-box">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="vendor-pie-center-text">
            <strong>{totalTickets > 999 ? `${(totalTickets / 1000).toFixed(1)}K` : totalTickets}</strong>
            <span>Bilet</span>
          </div>
        </div>

        <div className="vendor-pie-legend">
          {data.map((item, i) => (
            <div key={i} className="vendor-legend-item">
              <div className="vendor-legend-dot" style={{ backgroundColor: item.color }} />
              <span className="vendor-legend-text">{item.name}</span>
              <span className="vendor-legend-value">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
