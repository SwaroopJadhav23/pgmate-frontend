import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './DonutBreakdownChart.css';

const DonutBreakdownChart = ({ title, data, totalLabel, totalValue }) => {
  if (!data || data.length === 0 || totalValue === 0) {
    return (
      <div className="donut-breakdown-card">
        <h3>{title}</h3>
        <div className="donut-breakdown-empty">
          <p>No data to display for the selected period.</p>
        </div>
      </div>
    );
  }

  // Sort data by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value).filter(d => d.value > 0);

  return (
    <div className="donut-breakdown-card">
      <h3>{title}</h3>
      <div className="donut-breakdown-content">
        
        {/* Chart Section */}
        <div className="donut-chart-wrapper">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                dataKey="value"
                stroke="none"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="donut-chart-center">
            <div className="donut-total-value">₹{totalValue.toLocaleString()}</div>
            <div className="donut-total-label">{totalLabel}</div>
          </div>
        </div>

        {/* Legend Section */}
        <div className="donut-legend-wrapper">
          {sortedData.map((item, index) => {
            const percentage = ((item.value / totalValue) * 100).toFixed(1);
            return (
              <div key={index} className="donut-legend-item">
                <div className="donut-legend-dot" style={{ backgroundColor: item.color }}></div>
                <div className="donut-legend-info">
                  <div className="donut-legend-name">{item.name}</div>
                  <div className="donut-legend-stats">
                    <span className="donut-legend-percent">{percentage}%</span>
                    <span className="donut-legend-amount">(₹{item.value.toLocaleString()})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default DonutBreakdownChart;
