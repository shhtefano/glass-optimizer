import React from 'react';
import { Solution } from '../types/Solution';
import { Layers, AreaChart, Trash2, ShieldAlert, Award } from 'lucide-react';

interface StatisticsPanelProps {
  solution: Solution;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ solution }) => {
  const totalSheets = solution.sheetsUsed;
  const utilization = solution.utilization;
  const wasteArea = solution.wasteArea;
  const totalUsedArea = solution.sheets.reduce((acc, s) => acc + s.usedArea, 0);
  const totalArea = solution.sheets.reduce((acc, s) => acc + (s.width * s.height), 0);

  // Convert cm² to m²
  const usedAreaM2 = (totalUsedArea / 10000).toFixed(2);
  const wasteAreaM2 = (wasteArea / 10000).toFixed(2);
  const totalAreaM2 = (totalArea / 10000).toFixed(2);

  // SVG circular progress coordinates
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Overview Stat Section */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <h2 className="text-base font-bold text-white mb-6 font-display flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">
            <Award size={16} />
          </span>
          Rendiconto di Efficienza
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: Heuristic / yield rating gauge */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="transparent"
                stroke={utilization > 85 ? '#10b981' : utilization > 70 ? '#6366f1' : '#ec4899'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-white font-display">{utilization.toFixed(1)}%</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-500">Resa</span>
            </div>
          </div>

          {/* Right: Heuristic descriptions */}
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-white">
              {solution.algorithmName}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Questa soluzione è stata calcolata posizionando i pezzi secondo l'algoritmo{' '}
              <strong className="text-gray-300 font-semibold">{solution.algorithmName.split('-')[0].trim()}</strong>,
              ordinando le lastre per efficienza. Offre una resa totale del {utilization}% con {totalSheets} lastre utilizzate.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Numerical Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Metric 1: Sheets Used */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Lastre Utilizzate
            </span>
            <span className="block text-2xl font-black text-white mt-1 font-display">
              {totalSheets}
            </span>
            <span className="text-[10px] text-gray-400">
              Formato standard (300x240 cm)
            </span>
          </div>
        </div>

        {/* Metric 2: Demanded Area */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <AreaChart size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Vetro Richiesto
            </span>
            <span className="block text-2xl font-black text-white mt-1 font-display">
              {usedAreaM2} <span className="text-sm font-normal text-gray-400">m²</span>
            </span>
            <span className="text-[10px] text-gray-400">
              Somma aree pezzi richiesti
            </span>
          </div>
        </div>

        {/* Metric 3: Total Area Cut */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Superficie Lastre
            </span>
            <span className="block text-2xl font-black text-white mt-1 font-display">
              {totalAreaM2} <span className="text-sm font-normal text-gray-400">m²</span>
            </span>
            <span className="text-[10px] text-gray-400">
              Capacità totale delle lastre
            </span>
          </div>
        </div>

        {/* Metric 4: Waste Area */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Scarto Totale
            </span>
            <span className="block text-2xl font-black text-white mt-1 font-display">
              {wasteAreaM2} <span className="text-sm font-normal text-gray-400">m²</span>
            </span>
            <span className="text-[10px] text-gray-400">
              Perdita materiale: {(100 - utilization).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Unplaced pieces warning, if any */}
      {solution.unplacedPieces.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-rose-500/20 bg-rose-500/[0.02] flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/25 text-rose-400 shrink-0 animate-bounce">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="block text-sm font-bold text-rose-400">
              Attenzione: Pezzi Non Posizionati
            </span>
            <p className="text-xs text-gray-400 mt-1">
              I seguenti pezzi superano le dimensioni della lastra standard o non è stato possibile posizionarli:
            </p>
            <ul className="mt-2 space-y-1 text-xs font-semibold text-white">
              {solution.unplacedPieces.map((u, i) => (
                <li key={i} className="flex justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <span>{u.piece.name || `Pezzo ${u.piece.id}`} ({u.piece.width}x{u.piece.height} cm)</span>
                  <span className="text-rose-400">Quantità: {u.remainingQty}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
