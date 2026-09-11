import React from 'react';
import './StatCard.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  isPositive = true,
  subtext,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>

      <div className="stat-card-value">{value}</div>

      {(change || subtext) && (
        <div className="stat-card-footer">
          {change && (
            <span className={isPositive ? 'stat-change-positive' : 'stat-change-negative'}>
              {change}
            </span>
          )}
          {subtext && <span className="stat-subtext">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
