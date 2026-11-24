import React, { useState } from 'react';
import { TrendingUp, Zap, Clock, ShieldCheck } from 'lucide-react';

export const ClaimsTrendChart: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<'30d' | '90d' | '1y'>('30d');

  // Sample trend points for weekly adjudication volume and speed
  const trendData = [
    { period: 'Week 1', claims: 18, amountLakhs: 14.5, avgTimeMins: 2.1, zkSuccess: 100 },
    { period: 'Week 2', claims: 29, amountLakhs: 22.8, avgTimeMins: 1.8, zkSuccess: 100 },
    { period: 'Week 3', claims: 42, amountLakhs: 36.4, avgTimeMins: 1.6, zkSuccess: 100 },
    { period: 'Week 4', claims: 58, amountLakhs: 48.2, avgTimeMins: 1.4, zkSuccess: 100 },
    { period: 'Current', claims: 74, amountLakhs: 63.5, avgTimeMins: 1.2, zkSuccess: 100 },
  ];

  const maxClaims = 80;

  return (
    <div className="space-y-4">
      {/* Top metrics toggle & quick stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
            Tier 1 Instant Payouts (88%)
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#142D4E]" />
            Tier 2 Adjudicated (12%)
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(['30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedRange === range
                  ? 'bg-white text-[#142D4E] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar & Line Chart */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
          {trendData.map((item, idx) => {
            const barHeightPercent = Math.round((item.claims / maxClaims) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-md px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {item.claims} Claims · ₹{item.amountLakhs}L · {item.avgTimeMins}m avg
                </div>

                {/* Compound Bar: Tier 1 vs Tier 2 */}
                <div className="w-full max-w-[38px] bg-slate-200 rounded-t-md overflow-hidden flex flex-col justify-end" style={{ height: `${barHeightPercent}%` }}>
                  <div
                    className="w-full bg-[#142D4E] transition-all duration-500"
                    style={{ height: '14%' }}
                    title="Tier 2 Adjudicated"
                  />
                  <div
                    className="w-full bg-[#0D9488] transition-all duration-500"
                    style={{ height: '86%' }}
                    title="Tier 1 Instant"
                  />
                </div>

                {/* Period label */}
                <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chart footer stats */}
        <div className="mt-4 pt-3 border-t border-slate-200/70 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-slate-500 text-[11px]">Avg Settlement Time</div>
            <div className="font-bold text-[#0D9488] flex items-center justify-center gap-1 mt-0.5">
              <Zap className="w-3.5 h-3.5" /> 1.6 minutes
            </div>
            <div className="text-[10px] text-slate-400">vs 72h IRDAI standard</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Groth16 Pass Rate</div>
            <div className="font-bold text-[#142D4E] flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> 100% Valid
            </div>
            <div className="text-[10px] text-slate-400">11,845 constraints</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Double-Spend Rejections</div>
            <div className="font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> 0 Collisions
            </div>
            <div className="text-[10px] text-slate-400">Poseidon nullifier pool</div>
          </div>
        </div>
      </div>
    </div>
  );
};
