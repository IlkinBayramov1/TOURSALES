import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@toursales/ui';
import './MetricCard.css';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  change?: string;
  isPositive?: boolean;
  colorVariant?: 'blue' | 'green' | 'amber' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  change,
  isPositive = true,
  colorVariant = 'blue',
}) => {
  return (
    <Card variant="default" className="vendor-metric-card">
      <div className="vendor-metric-header">
        <span className="vendor-metric-title">{title}</span>
        <div className={`vendor-metric-icon-wrap variant-${colorVariant}`}>
          {icon}
        </div>
      </div>

      <div className="vendor-metric-body">
        <div className="vendor-metric-value">{value}</div>

        <div className="vendor-metric-footer">
          {trend && (
            <div
              className={`vendor-metric-trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}
            >
              {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend.isPositive ? `+${trend.value}%` : `${trend.value}%`}</span>
            </div>
          )}

          {change && (
            <div
              className={`vendor-metric-trend ${isPositive ? 'trend-up' : 'trend-down'}`}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{change}</span>
            </div>
          )}

          {subtitle && (
            <span className="vendor-metric-sub">{subtitle}</span>
          )}
        </div>
      </div>
    </Card>
  );
};
