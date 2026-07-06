import React from 'react';
import { Solution } from '../types/Solution';
import { AlertTriangle } from 'lucide-react';

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
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            TOP 1 (Migliore)
          </span>
        );
      case 2:
        return (
          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            TOP 2
          </span>
        );
      case 3:
        return (
          <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
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
      className={`glass-panel rounded-2xl p-4 border cursor-pointer transition-all duration-300 relative overflow-hidden group ${getCardBorder(
        rank,
        isActive
      )}`}
    >
      {/* Decorative Accent Glow */}
      {isActive && (
        <div
          className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity pointer-events-none ${
            rank === 1 ? 'bg-emerald-500' : rank === 2 ? 'bg-indigo-500' : 'bg-pink-500'
          }`}
        ></div>
      )}

      <div className="flex flex-col gap-3">
        {/* Row 1: Header (Rank, Algo & Sheet count) */}
        <div className="flex flex-col gap-1.5 items-start">
          {getRankBadge(rank)}
          <div className="flex items-center justify-between w-full gap-2">
            <span className="font-mono text-[9px] bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider text-gray-500 truncate">
              {solution.algorithmName.split('-')[0].trim()}
            </span>
            <span className="text-[10px] font-extrabold text-indigo-400 font-mono shrink-0">
              {solution.sheetsUsed} {solution.sheetsUsed === 1 ? 'Lastra' : 'Lastre'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-1"></div>

        {/* Row 3: Vertical performance statistics (Taller, bigger text) */}
        <div className="flex flex-col gap-2">
          {/* Utilization */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-gray-400 font-medium">Resa:</span>
              <span className="text-sm font-extrabold text-white font-mono">{solution.utilization}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rank === 1 ? 'bg-emerald-500' : rank === 2 ? 'bg-indigo-500' : 'bg-pink-500'
                }`}
                style={{ width: `${solution.utilization}%` }}
              ></div>
            </div>
          </div>

          {/* Waste */}
          <div className="flex justify-between items-baseline text-xs pt-1">
            <span className="text-gray-400 font-medium">Scarto:</span>
            <span className="text-xs font-bold text-white font-mono">{(solution.wasteArea / 10000).toFixed(2)} m²</span>
          </div>
        </div>

        {/* Row 4: Placed Counts Footer */}
        <div className="flex flex-col gap-1 text-[10px] text-gray-500 border-t border-white/5 pt-2">
          <div className="flex items-center justify-between">
            <span>Tagliati:</span>
            <span className="font-semibold text-white">{totalPlacedCount} pezzi</span>
          </div>
          {totalUnplacedCount > 0 && (
            <div className="text-red-400 font-extrabold flex items-center gap-1 mt-1 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 animate-pulse">
              <AlertTriangle size={11} />
              <span>{totalUnplacedCount} non piazzati!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
