import React, { useState, useEffect, useTransition } from 'react';
import { Piece } from './types/Piece';
import { Solution } from './types/Solution';
import { optimizeGlassCutting } from './algorithms/optimizer';
import { PieceForm } from './components/PieceForm';
import { SolutionCard } from './components/SolutionCard';
import { SheetVisualizer } from './components/SheetVisualizer';
import { StatisticsPanel } from './components/StatisticsPanel';
import { Sparkles, Layers, Info, CheckCircle, Lightbulb } from 'lucide-react';

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

  // Run optimization on initial mount
  useEffect(() => {
    const results = optimizeGlassCutting(pieces, sheetWidth, sheetHeight, globalRotation);
    setSolutions(results);
  }, []);

  const activeSolution = solutions[activeSolutionIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col">
      {/* 1. Navbar / Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 backdrop-blur-md px-6 py-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/25">
              V
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white font-display flex items-center gap-1.5">
                VetroOptima <span className="text-xs bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase">2D</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                Ottimizzazione Taglio Lastre di Vetro
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 border border-white/5 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tutti i calcoli eseguiti in locale (Client-Side)</span>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Form & Inputs (40% width) */}
        <section className="lg:col-span-5 xl:col-span-4 space-y-6 no-print">
          <PieceForm
            pieces={pieces}
            setPieces={setPieces}
            sheetWidth={sheetWidth}
            setSheetWidth={setSheetWidth}
            sheetHeight={sheetHeight}
            setSheetHeight={setSheetHeight}
            globalRotation={globalRotation}
            setGlobalRotation={setGlobalRotation}
            onOptimize={handleOptimize}
            isCalculating={isCalculating || isPending}
          />
        </section>

        {/* Right Column: Solutions & Visualization (60% width) */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-6">
          {isCalculating || isPending ? (
            /* Loading State Shimmer UI */
            <div className="space-y-6">
              {/* Solution cards placeholder */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 h-36 shimmer-effect"></div>
                ))}
              </div>
              {/* Visualizer canvas placeholder */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5 h-[450px] shimmer-effect"></div>
            </div>
          ) : solutions.length === 0 ? (
            /* Empty State */
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                📐
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-display">Pronto per l'Ottimizzazione</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Inserisci l'elenco dei pezzi di vetro da produrre nella colonna sinistra e clicca su <strong>"Calcola Disposizione Ottimale"</strong> per generare gli schemi di taglio.
              </p>
            </div>
          ) : (
            /* Results Panel */
            <div className="space-y-6 animate-in fade-in duration-300">



              {/* Visualizer Container (Full Width) */}
              <div className="w-full">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-400" />
                  Schema Grafico di Taglio
                </h3>
                <SheetVisualizer sheets={activeSolution.sheets} pieces={pieces} />
              </div>


              {/* Top Solutions Candidate Selector */}
              <div className="no-print">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-400" />
                  Migliori Soluzioni Generate ({solutions.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>
          )}
        </section>
      </main>

      {/* 3. Footer */}
      <footer className="mt-auto border-t border-white/5 py-4 px-6 text-center text-xs text-gray-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 VetroOptima 2D. Tutti i diritti riservati.</span>
          <span className="flex items-center gap-2">
            Disegnato per massimizzare la resa e ridurre gli scarti di lastre standard.
          </span>
        </div>
      </footer>
    </div>
  );
}
