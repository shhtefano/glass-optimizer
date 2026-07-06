import React, { useState, useEffect, useTransition } from 'react';
import { Piece } from './types/Piece';
import { Solution } from './types/Solution';
import { optimizeGlassCutting } from './algorithms/optimizer';
import { PieceForm } from './components/PieceForm';
import { SolutionCard } from './components/SolutionCard';
import { SheetVisualizer } from './components/SheetVisualizer';
import { StatisticsPanel } from './components/StatisticsPanel';
import { Sparkles, Layers, Info, CheckCircle, Lightbulb, RotateCw } from 'lucide-react';

const INITIAL_PIECES: Piece[] = [];

export default function App() {
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [sheetWidth, setSheetWidth] = useState<number>(240);
  const [sheetHeight, setSheetHeight] = useState<number>(300);
  const [globalRotation, setGlobalRotation] = useState<boolean>(true);

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [activeSolutionIndex, setActiveSolutionIndex] = useState<number>(0);

  const [isPending, startTransition] = useTransition();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Trigger optimization
  const handleOptimize = () => {
    setIsCalculating(true);
    // Simulate a slight delay to allow loading animations to display (gives a highly professional desktop app feel)
    setTimeout(() => {
      startTransition(() => {
        const results = optimizeGlassCutting(pieces, sheetWidth, sheetHeight, globalRotation);
        setSolutions(results);
        setActiveSolutionIndex(0);
        setIsCalculating(false);
      });
    }, 450);
  };

  const handleRotateSheet = () => {
    const temp = sheetWidth;
    setSheetWidth(sheetHeight);
    setSheetHeight(temp);
  };

  // Run optimization on initial mount
  useEffect(() => {
    const results = optimizeGlassCutting(pieces, sheetWidth, sheetHeight, globalRotation);
    setSolutions(results);
  }, []);

  const activeSolution = solutions[activeSolutionIndex];

  return (
    <div className="min-h-screen md:h-screen bg-slate-950 text-gray-100 flex flex-col md:overflow-hidden">

      {/* 1. Horizontal Starting Plate Bar */}
      <header className="glass-panel border-b border-white/5 px-4 sm:px-6 py-6 no-print shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">

          {/* Starting Plate Inputs Group */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Misure Lastra da tagliare:</span>

            {/* Width Input */}
            <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Larghezza (cm)</span>
              <input
                type="number"
                value={sheetWidth || ''}
                onChange={(e) => setSheetWidth(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                className="w-20 sm:w-24 bg-transparent border-0 text-white text-base focus:outline-none p-0 focus:ring-0 font-semibold font-mono"
                placeholder="Larghezza"
              />
            </div>

            {/* Swap/Rotate Button */}
            <button
              type="button"
              onClick={handleRotateSheet}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shrink-0"
              title="Inverti dimensioni (Ruota Lastra)"
            >
              <RotateCw size={13} />
            </button>

            {/* Height Input */}
            <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Altezza (cm)</span>
              <input
                type="number"
                value={sheetHeight || ''}
                onChange={(e) => setSheetHeight(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                className="w-20 sm:w-24 bg-transparent border-0 text-white text-base focus:outline-none p-0 focus:ring-0 font-semibold font-mono"
                placeholder="Altezza"
              />
            </div>
          </div>


          {/* Config Controls and Run Button Group */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between md:justify-end w-full md:w-auto flex-grow md:flex-grow-0">
            {/* Rotation Option */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-gray-300 bg-slate-900/40 border border-white/5 px-3 py-2 rounded-xl hover:bg-slate-900/60 transition-colors">
              <input
                type="checkbox"
                checked={globalRotation}
                onChange={(e) => setGlobalRotation(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 border-white/10 bg-slate-950 focus:ring-indigo-500"
              />
              <span>Consenti rotazione</span>
            </label>

            {/* Area Info Badge */}
            <div className="text-sm font-medium text-gray-400 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
              Area Lastra: <strong className="text-white font-mono">{((sheetWidth * sheetHeight) / 10000).toFixed(2)} m²</strong>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-grow w-full mx-auto px-4 sm:px-8 py-4 md:py-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 max-w-none">

        {/* Left Column: Form & Inputs (25% width on desktop) */}
        <section className="md:col-span-3 lg:col-span-3 flex flex-col min-h-0 no-print">
          <PieceForm
            pieces={pieces}
            setPieces={setPieces}
            sheetWidth={sheetWidth}
            sheetHeight={sheetHeight}
            onOptimize={handleOptimize}
            isCalculating={isCalculating || isPending}
          />
        </section>
        {solutions.length === 0 && !isCalculating && !isPending ? (
          /* Empty State spanning remaining columns */
          <section className="md:col-span-8 lg:col-span-9 flex flex-col min-h-0 h-full">
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 flex flex-col items-center justify-center flex-1 min-h-0">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                📐
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-display">Pronto per l'Ottimizzazione</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Inserisci l'elenco dei pezzi di vetro da produrre nella colonna sinistra e clicca su <strong>"Calcola Disposizione"</strong> per generare gli schemi di taglio.
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* Center Column: Visualizer (cols 4-10 on lg) */}
            <section className="md:col-span-6 lg:col-span-7 flex flex-col min-h-0 h-full">
              {isCalculating || isPending ? (
                /* Shimmer visualizer canvas placeholder */
                <div className="glass-panel rounded-3xl p-6 border border-white/5 flex-1 shimmer-effect min-h-0"></div>
              ) : (
                /* Results Panel */
                <div className="flex-1 min-h-0 flex flex-col">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 shrink-0">
                    <Layers size={14} className="text-indigo-400" />
                    Schema Grafico di Taglio
                  </h3>
                  <SheetVisualizer sheets={activeSolution.sheets} pieces={pieces} />
                </div>
              )}
            </section>

            {/* Right Column: Solutions list (cols 11-12 on lg) */}
            <section className="md:col-span-3 lg:col-span-2 flex flex-col min-h-0 no-print h-full justify-between">
              {isCalculating || isPending ? (
                <div className="flex-1 flex flex-col space-y-3 min-h-0 w-full max-w-[200px] mx-auto">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 shrink-0">
                    <Sparkles size={14} className="text-indigo-400" />
                    Migliori Soluzioni
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-panel rounded-2xl p-4 border border-white/5 h-24 shimmer-effect w-full shrink-0"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-3 min-h-0 w-full max-w-[200px] mx-auto">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 shrink-0">
                    <Sparkles size={14} className="text-indigo-400" />
                    Migliori Soluzioni ({solutions.length})
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin flex flex-col min-h-0">
                    {solutions.map((sol, index) => (
                      <SolutionCard
                        key={sol.id}
                        solution={sol}
                        rank={index + 1}
                        isActive={activeSolutionIndex === index}
                        onClick={() => setActiveSolutionIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="mt-auto border-t border-white/5 py-3 px-6 text-center text-[11px] text-gray-500 no-print shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; Prodotto da Vetreria Galanti. Tutti i diritti riservati.</span>
          <span className="flex items-center gap-2">
            Vetreria Galanti &copy; 2026.
          </span>
        </div>
      </footer>
    </div>
  );
}
