import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="panel-glass p-3 text-xs border border-amber-500/30 shadow-2xl space-y-1">
        <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-bold font-mono">Rs. {Number(entry.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueTrendChart = ({ data = [], interval = 'daily', setInterval = () => {} }) => {
  // Sample data fallback so the chart frame looks alive even if database has 0 historical entries
  const sampleData = [
    { _id: 'Mon', grossRevenue: 45000, expenses: 12000, netProfit: 33000 },
    { _id: 'Tue', grossRevenue: 68000, expenses: 15000, netProfit: 53000 },
    { _id: 'Wed', grossRevenue: 52000, expenses: 11000, netProfit: 41000 },
    { _id: 'Thu', grossRevenue: 89000, expenses: 21000, netProfit: 68000 },
    { _id: 'Fri', grossRevenue: 110000, expenses: 25000, netProfit: 85000 },
    { _id: 'Sat', grossRevenue: 95000, expenses: 18000, netProfit: 77000 },
    { _id: 'Sun', grossRevenue: 130000, expenses: 28000, netProfit: 102000 },
  ];

  const chartData = data && data.length > 0 ? data : sampleData;
  const isSample = !data || data.length === 0;

  return (
    <div className="panel-glass p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Platform Revenue & Profit Trends
            {isSample && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                SAMPLE SIMULATION
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Historical transaction metrics comparing gross margins, logistics expenses, and net profit.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          {['daily', 'weekly', 'monthly'].map((item) => (
            <button
              key={item}
              onClick={() => setInterval(item)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                interval === item
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="_id" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Area type="monotone" dataKey="grossRevenue" name="Gross Revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGross)" />
            <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueTrendChart;
