import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="panel-glass p-3 text-xs border border-amber-500/30 shadow-2xl space-y-1">
        <p className="font-bold text-slate-200">{data.name}</p>
        <p className="font-mono text-amber-400 font-bold">
          Rs. {Number(data.value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const RevenueBreakdownChart = ({ stats = null }) => {
  const data = [
    { name: 'Admin Price Margins', value: stats?.totalMarginAmount || 65000 },
    { name: 'Volume Platform Fees', value: stats?.totalVolumeFee || 18500 },
    { name: 'Transaction Commissions', value: stats?.totalCommissionAmount || 12200 },
  ];

  return (
    <div className="panel-glass p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-100">Revenue Stream Breakdown</h3>
        <p className="text-xs text-slate-400 mt-1">Distribution across product margins, volume fees, and commissions.</p>
      </div>

      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(13,22,16,0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueBreakdownChart;
