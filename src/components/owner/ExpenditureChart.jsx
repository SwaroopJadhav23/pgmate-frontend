import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './ExpenditureChart.css';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

const ExpenditureChart = ({ expenses }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="expenditure-chart-empty">
        <p>No expenditure data to display for the selected period.</p>
      </div>
    );
  }

  // Aggregate by category
  const aggregatedData = expenses.reduce((acc, curr) => {
    const category = curr.category || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += curr.amount;
    return acc;
  }, {});

  const data = Object.keys(aggregatedData).map((key) => ({
    name: key,
    value: aggregatedData[key],
  }));

  return (
    <div className="expenditure-chart-container">
      <h3>Expenditure by Category</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `₹${value.toLocaleString()}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenditureChart;
