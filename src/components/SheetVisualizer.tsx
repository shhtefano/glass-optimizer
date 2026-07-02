import React, { useState } from 'react';
import { Sheet } from '../types/Sheet';
import { Piece } from '../types/Piece';
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, RefreshCw, Printer } from 'lucide-react';

interface SheetVisualizerProps {
  sheets: Sheet[];
  pieces: Piece[];
}

// Generate stable colors based on string ID
const getPieceColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Choose nice colors: Saturation ~65%, Lightness ~45% (sleek dark-mode look)
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
};

export const SheetVisualizer: React.FC<SheetVisualizerProps> = ({ sheets, pieces }) => {
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  if (sheets.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center border border-white/5 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-4">
          📏
        </div>
        <h3 className="text-lg font-bold text-white mb-2 font-display">Nessun Risultato da Visualizzare</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Aggiungi i tuoi pezzi ed esegui l'ottimizzazione per visualizzare la disposizione dei tagli.
        </p>
      </div>
    );
  }

  const currentSheet = sheets[currentSheetIndex] || sheets[0];
  const totalSheets = sheets.length;

  const handleNextSheet = () => {
    setCurrentSheetIndex((prev) => (prev + 1) % totalSheets);
  };

  const handlePrevSheet = () => {
    setCurrentSheetIndex((prev) => (prev - 1 + totalSheets) % totalSheets);
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.15, 2));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.15, 0.5));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  // Pre-calculate mapping from piece ID to human name for quick lookup
  const pieceNameMap = new Map<string, string>();
  pieces.forEach((p) => {
    if (p.name) pieceNameMap.set(p.id, p.name);
  });

  const renderSheetSVG = (sheet: Sheet) => {
    const sw = sheet.width;
    const sh = sheet.height;

    // We draw using SVG. The coordinate system:
    // (0,0) starts at top-left.
    // Glass cutters usually work from bottom-left or top-left.
    // We will draw it as traditional (x, y) where x is horizontal, y is vertical, from bottom-left (y-flipped) or top-left.
    // Let's draw it from bottom-left as standard Cartesian coordinates, flipping Y for SVG:
    // SVG_Y = sheetHeight - Cartesian_Y - Piece_Height

    return (
      <svg
        viewBox={`0 0 ${sw} ${sh}`}
        className="max-h-full max-w-full w-auto h-auto bg-[#0a0d16] border border-white/10 rounded-xl shadow-inner select-none transition-all duration-200"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Definition for waste striped pattern */}
        <defs>
          <pattern
            id="waste-stripe"
            width="20"
            height="20"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="20"
              stroke="rgba(239, 68, 68, 0.15)"
              strokeWidth="5"
            />
            <rect width="20" height="20" fill="rgba(239, 68, 68, 0.02)" />
          </pattern>
        </defs>

        {/* Stock sheet boundary (default background is the waste pattern) */}
        <rect
          x="0"
          y="0"
          width={sw}
          height={sh}
          fill="url(#waste-stripe)"
          stroke="rgba(239, 68, 68, 0.2)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Background Grid Pattern (fine details) */}
        {/* (Vertical lines every 10cm, horizontal lines every 10cm) */}
        {Array.from({ length: Math.floor(sw / 10) }).map((_, i) => (
          <line
            key={`grid-v-${i}`}
            x1={(i + 1) * 10}
            y1="0"
            x2={(i + 1) * 10}
            y2={sh}
            stroke="rgba(255, 255, 255, 0.025)"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: Math.floor(sh / 10) }).map((_, i) => (
          <line
            key={`grid-h-${i}`}
            x1="0"
            y1={(i + 1) * 10}
            x2={sw}
            y2={(i + 1) * 10}
            stroke="rgba(255, 255, 255, 0.025)"
            strokeWidth="0.5"
          />
        ))}

        {/* Leftover Waste Rectangles (labeled with measurements) */}
        {sheet.wasteRects?.map((wRect, idx) => {
          const wx = wRect.x;
          // Flip Y coordinate so (0,0) is bottom-left
          const wy = sh - wRect.y - wRect.height;
          const ww = wRect.width;
          const wh = wRect.height;

          const isLargeW = ww >= 18;
          const isLargeH = wh >= 12;

          return (
            <g key={`waste-${idx}`} className="group cursor-help">
              {/* Waste Rect */}
              <rect
                x={wx}
                y={wy}
                width={ww}
                height={wh}
                fill="url(#waste-stripe)"
                stroke="rgba(239, 68, 68, 0.25)"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                className="hover:fill-opacity-30 transition-all duration-150"
              />
              
              {/* Size Label for Waste Rect */}
              {isLargeW && isLargeH ? (
                <text
                  x={wx + ww / 2}
                  y={wy + wh / 2 + 1.5}
                  textAnchor="middle"
                  fill="rgba(248, 113, 113, 0.75)"
                  fontSize="4.5"
                  className="font-mono font-semibold pointer-events-none"
                >
                  {Math.round(ww)}×{Math.round(wh)}
                </text>
              ) : null}

              <title>
                {`Scarto (${ww.toFixed(1)} × ${wh.toFixed(1)} cm)\nPosizione: X=${wx.toFixed(1)}, Y=${wRect.y.toFixed(1)} cm`}
              </title>
            </g>
          );
        })}

        {/* Placed Glass Pieces */}
        {sheet.placements.map((placement, idx) => {
          const px = placement.x;
          // Flip Y coordinate so (0,0) is bottom-left
          const py = sh - placement.y - placement.height;
          const pw = placement.width;
          const ph = placement.height;
          const color = getPieceColor(placement.pieceId);

          // We'll hide text if dimensions are too small in the SVG box to fit text legibly
          const isLargeW = pw >= 20;
          const isLargeH = ph >= 15;

          return (
            <g key={`placement-${idx}`} className="group cursor-help">
              {/* Placed Piece Pane */}
              <rect
                x={px}
                y={py}
                width={pw}
                height={ph}
                fill={color}
                fillOpacity="0.45"
                stroke={color}
                strokeWidth="1.5"
                className="hover:fill-opacity-65 transition-all duration-150"
              />
              {/* Inside reflection/gloss effect */}
              <rect
                x={px + 0.8}
                y={py + 0.8}
                width={pw - 1.6}
                height={ph - 1.6}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />

              {/* Labels inside piece */}
              {isLargeW && isLargeH ? (
                <>
                  {/* Name Label */}
                  <text
                    x={px + pw / 2}
                    y={py + ph / 2 - 2}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7.5"
                    fontWeight="bold"
                    className="font-sans pointer-events-none drop-shadow-md"
                  >
                    {placement.pieceName || `Pezzo ${placement.pieceId.slice(0, 4)}`}
                  </text>
                  {/* Size Label (Width x Height) */}
                  <text
                    x={px + pw / 2}
                    y={py + ph / 2 + 8}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.8)"
                    fontSize="6"
                    className="font-mono font-medium pointer-events-none drop-shadow"
                  >
                    {pw} × {ph} cm
                  </text>
                  {/* Rotated Badge */}
                  {placement.rotated && (
                    <text
                      x={px + pw / 2}
                      y={py + ph - 5}
                      textAnchor="middle"
                      fill="#fcd34d"
                      fontSize="4.5"
                      fontWeight="bold"
                      className="font-sans tracking-wide uppercase pointer-events-none opacity-80 no-print"
                    >
                      🔄 Ruotato
                    </text>
                  )}
                </>
              ) : (
                // Mini-label for tiny pieces
                <text
                  x={px + pw / 2}
                  y={py + ph / 2 + 2}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="5"
                  fontWeight="bold"
                  className="font-sans pointer-events-none"
                >
                  {pw}x{ph}
                </text>
              )}

              {/* Tooltip on Hover */}
              <title>
                {`${placement.pieceName || 'Pezzo'} (${pw}x${ph}cm)\nPosizione: X=${placement.x}, Y=${placement.y}cm\n${
                  placement.rotated ? 'Ruotato di 90°' : 'Orientamento Originale'
                }`}
              </title>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Visualizer Header Toolbar */}
      <div className="glass-panel rounded-2xl px-5 py-4 border border-white/5 flex flex-wrap items-center justify-between gap-4 no-print">
        {/* Left: View Mode Switches & Sheet indicator */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => { setViewMode('single'); handleResetZoom(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'single'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Vista Singola
            </button>
            <button
              onClick={() => { setViewMode('grid'); handleResetZoom(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Griglia Lastre
            </button>
          </div>

          {viewMode === 'single' && (
            <span className="text-sm font-semibold text-gray-300">
              Lastra {currentSheetIndex + 1} di {totalSheets}
            </span>
          )}
        </div>

        {/* Middle/Right: Controls for Navigation, Zoom & Print */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl p-1">
            <button
              onClick={handleZoomOut}
              disabled={viewMode === 'grid'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Zoom Indietro"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-mono font-medium text-gray-400 min-w-8 text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={viewMode === 'grid'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Zoom Avanti"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              disabled={viewMode === 'grid'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Reset Zoom"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl text-indigo-400 hover:text-white hover:bg-indigo-500 bg-indigo-500/10 border border-indigo-500/25 transition-all flex items-center gap-2 h-8"
            title="Stampa / Esporta PDF"
          >
            <Printer size={14} />
            <span className="text-xs font-bold hidden sm:inline">Stampa PDF</span>
          </button>

          {/* Navigator for single view */}
          {viewMode === 'single' && totalSheets > 1 && (
            <div className="flex bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={handlePrevSheet}
                className="p-2.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Lastra Precedente"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="border-l border-white/10 my-2"></div>
              <button
                onClick={handleNextSheet}
                className="p-2.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Lastra Successiva"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visualizer Canvas Area */}
      {viewMode === 'single' ? (
        <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Print-Only Header (hidden on screen, visible on print) */}
          <div className="hidden print:block w-full max-w-[800px] mb-6 border-b-2 border-slate-300 pb-4 text-slate-800">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Schema di Taglio Lastra di Vetro</h1>
                <p className="text-xs font-medium text-slate-500 mt-1">Ottimizzato con VetroOptima 2D</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-sm">Lastra {currentSheetIndex + 1} di {totalSheets}</p>
                <p className="text-slate-500 mt-0.5">Dimensioni Lastra: {currentSheet.width} × {currentSheet.height} cm</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="block text-slate-500 font-medium">Efficienza Resa:</span>
                <span className="font-bold text-slate-900">{currentSheet.utilization.toFixed(1)}%</span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium">Pezzi Piazzati:</span>
                <span className="font-bold text-slate-900">{currentSheet.placements.length}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium">Scarto Lastra:</span>
                <span className="font-bold text-slate-900">{((currentSheet.wasteArea) / 10000).toFixed(2)} m²</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[800px] h-[340px] sm:h-[420px] md:h-[500px] flex items-center justify-center relative overflow-hidden transition-all duration-300 visualizer-wrapper">
            {renderSheetSVG(currentSheet)}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4 items-center justify-between w-full max-w-[800px] text-xs text-gray-400 border-t border-white/5 pt-3 no-print">
            <span>Dim: {currentSheet.width} × {currentSheet.height} cm</span>
            <span>Utilizzo Lastra: <strong className="text-white">{currentSheet.utilization.toFixed(1)}%</strong></span>
            <span>Spazio Tagliato: {currentSheet.placements.length} pezzi</span>
          </div>
        </div>
      ) : (
        /* Grid Layout View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map((sheet, index) => (
            <div key={sheet.id} className="glass-panel rounded-3xl p-4 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-gray-200">Lastra #{index + 1}</span>
                <span className="text-indigo-400 font-medium">Utilizzo: {sheet.utilization.toFixed(1)}%</span>
              </div>
              <div className="w-full relative overflow-hidden aspect-[240/300] max-w-[350px] mx-auto">
                {renderSheetSVG(sheet)}
              </div>
              <div className="mt-3 text-[11px] text-gray-400 text-center">
                Dim: {sheet.width} × {sheet.height} cm ({sheet.placements.length} pezzi)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="glass-panel rounded-2xl px-5 py-3.5 border border-white/5 flex flex-wrap gap-6 items-center text-xs text-gray-400 justify-center no-print">
        <span className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">Legenda:</span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 bg-indigo-500/40 border border-indigo-500 rounded"></span>
          <span>Pezzi Tagliati Posizionati</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 bg-red-500/10 border border-dashed border-red-500/40 waste-pattern"></span>
          <span>Scarto / Spazio Inutilizzato</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔄</span>
          <span>Pezzo Ruotato (90°)</span>
        </div>
      </div>
    </div>
  );
};
