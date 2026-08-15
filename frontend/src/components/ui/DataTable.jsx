import React from 'react';
import { Info } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = 'No items found.',
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-md ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider z-10">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Info size={24} className="text-amber-500/60" />
                  <p className="font-semibold text-slate-400">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row._id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`group transition-colors duration-150 ${
                  rowIdx % 2 === 0 ? 'bg-slate-950/20' : 'bg-slate-900/20'
                } hover:bg-amber-500/5 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 text-slate-300 group-hover:text-white ${
                      col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
