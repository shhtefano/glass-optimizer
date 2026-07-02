import React from 'react';
import { Solution } from '../types/Solution';
import { Layers, Percent, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SolutionCardProps {
  solution: Solution;
  rank: number;
  isActive: boolean;
  onClick: () => void;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({
  solution,
  rank,
  isActive,
  onClick
}) => {
  const getRankBadge = (r: number) => {
    switch (r) {
      case 1:
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
            TOP 1 (Migliore)
          </span>
        );
      case 2:
        return (
          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
            TOP 2
          </span>
        );
      case 3:
        return (
          <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
            TOP 3
          </span>
        );
      default:
        return null;
    }
  };

  const getCardBorder = (r: number, active: boolean) => {
    if (!active) return 'border-white/5 bg-slate-900/30 hover:border-white/15 hover:bg-slate-900/50';
    switch (r) {
      case 1:
        return 'border-emerald-500/50 bg-emerald-500/[0.04] shadow-lg shadow-emerald-500/5';
      case 2:
        return 'border-indigo-500/50 bg-indigo-500/[0.04] shadow-lg shadow-indigo-500/5';
      case 3:
        return 'border-pink-500/50 bg-pink-500/[0.04] shadow-lg shadow-pink-500/5';
      default:
        return 'border-white/20 bg-white/5';
    }
  };

  const totalPlacedCount = solution.sheets.reduce((acc, s) => acc + s.placements.length, 0);
  const totalUnplacedCount = solution.unplacedPieces.reduce((acc, p) => acc + p.remainingQty, 0);

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 border cursor-pointer transition-all duration-300 relative overflow-hidden group ${getCardBorder(
        rank,
        isActive
      )}`}
    >
      {/* Decorative Accent Glow */}
      {isActive && (
        <div
          className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity ${
            rank === 1 ? 'bg-emerald-500' : rank === 2 ? 'bg-indigo-500' : 'bg-pink-500'
          }`}
        ></div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        {getRankBadge(rank)}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          {isActive && (
            <CheckCircle2
              size={14}
              className={rank === 1 ? 'text-emerald-400' : rank === 2 ? 'text-indigo-400' : 'text-pink-400'}
            />
          )}
          <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider text-gray-500">
            {solution.algorithmName.split('-')[0].trim()}
          </span>
        </div>
      </div>

      {/* Primary Statistic (Big) */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-extrabold tracking-tight text-white font-display">
          {solution.sheetsUsed}
        </span>
        <span className="text-sm font-semibold text-gray-400">
          {solution.sheetsUsed === 1 ? 'Lastra' : 'Lastre'}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            rank === 1 ? 'bg-emerald-500' : rank === 2 ? 'bg-indigo-500' : 'bg-pink-500'
          }`}
          style={{ width: `${solution.utilization}%` }}
        ></div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
          <div className="flex items-center gap-1 text-gray-400 mb-1">
            <Percent size={12} className="text-gray-500" />
            <span>Utilizzo</span>
          </div>
          <span className="font-semibold text-white">{solution.utilization}%</span>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
          <div className="flex items-center gap-1 text-gray-400 mb-1">
            <Trash2 size={12} className="text-gray-500" />
            <span>Scarto</span>
          </div>
          <span className="font-semibold text-white">
            {(solution.wasteArea / 10000).toFixed(2)} m²
          </span>
        </div>
      </div>

      {/* Placement warnings or counts */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-2">
        <span>{totalPlacedCount} pezzi tagliati</span>
        {totalUnplacedCount > 0 && (
          <span className="text-red-400 font-semibold flex items-center gap-1 animate-pulse">
            <AlertTriangle size={11} />
            {totalUnplacedCount} non piazzati!
          </span>
        )}
      </div>
    </div>
  );
};
