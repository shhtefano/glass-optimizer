import React, { useState, useRef, useEffect } from 'react';
import { Piece } from '../types/Piece';
import {
  Plus, Trash2, RotateCcw, AlertCircle, Check, X, Edit2, Sparkles
} from 'lucide-react';

interface PieceFormProps {
  pieces: Piece[];
  setPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  sheetWidth: number;
  sheetHeight: number;
  onOptimize: () => void;
  isCalculating: boolean;
}

export const PieceForm: React.FC<PieceFormProps> = ({
  pieces,
  setPieces,
  sheetWidth,
  sheetHeight,
  onOptimize,
  isCalculating
}) => {
  const widthInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus width input on mount
  useEffect(() => {
    widthInputRef.current?.focus();
  }, []);

  // Input fields state
  const [name, setName] = useState('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [rotatable, setRotatable] = useState(true);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddPiece = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!width || !height || width <= 0 || height <= 0 || quantity <= 0) {
      setErrorMsg('Inserisci dimensioni e quantità valide (maggiori di 0).');
      return;
    }

    if (width > sheetWidth && height > sheetWidth) {
      setErrorMsg(`Il pezzo è troppo largo per la larghezza della lastra (${sheetWidth} cm).`);
      return;
    }
    if (width > sheetHeight && height > sheetHeight) {
      setErrorMsg(`Il pezzo è troppo alto per l'altezza della lastra (${sheetHeight} cm).`);
      return;
    }

    setErrorMsg('');

    if (editingId) {
      // Update existing piece
      setPieces(prev => prev.map(p => p.id === editingId ? {
        ...p,
        name: name.trim() || `Pezzo ${p.id}`,
        width: Number(width),
        height: Number(height),
        quantity,
        rotatable
      } : p));
      setEditingId(null);
    } else {
      // Create new piece
      const newPiece: Piece = {
        id: Date.now().toString(),
        name: name.trim() || `Pezzo ${pieces.length + 1}`,
        width: Number(width),
        height: Number(height),
        quantity,
        rotatable
      };
      setPieces(prev => [...prev, newPiece]);
    }

    // Reset inputs
    setName('');
    setWidth('');
    setHeight('');
    setQuantity(1);
    setRotatable(true);

    // Defer refocusing to allow all pending updates to resolve
    setTimeout(() => {
      if (widthInputRef.current) {
        widthInputRef.current.focus();
        widthInputRef.current.select();
      }
    }, 150);
  };

  const handleEditClick = (piece: Piece) => {
    setEditingId(piece.id);
    setName(piece.name || '');
    setWidth(piece.width);
    setHeight(piece.height);
    setQuantity(piece.quantity);
    setRotatable(piece.rotatable);
    
    setTimeout(() => {
      if (widthInputRef.current) {
        widthInputRef.current.focus();
        widthInputRef.current.select();
      }
    }, 150);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setWidth('');
    setHeight('');
    setQuantity(1);
    setRotatable(true);

    setTimeout(() => {
      if (widthInputRef.current) {
        widthInputRef.current.focus();
        widthInputRef.current.select();
      }
    }, 150);
  };

  const handleDeletePiece = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setPieces(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const handleClearAll = () => {
    if (window.confirm('Sei sicuro di voler svuotare l\'elenco dei pezzi?')) {
      setPieces([]);
      handleCancelEdit();
      setErrorMsg('');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-white/5 flex-grow flex flex-col h-full min-h-0 relative overflow-hidden">

      {/* Header Area */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5 shrink-0">
        <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Plus size={16} />
          </span>
          {editingId ? 'Modifica Pezzo' : 'Aggiungi Pezzo'}
          <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-normal ml-1">
            {pieces.reduce((acc, p) => acc + p.quantity, 0)} totali
          </span>
        </h2>
        {pieces.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 bg-rose-500/10 border border-rose-500/10 px-2.5 py-1 rounded-lg hover:border-rose-500/25 transition-all"
          >
            <Trash2 size={12} /> Svuota
          </button>
        )}
      </div>

      {/* Form Inputs */}
      <form onSubmit={handleAddPiece} className="space-y-3.5 shrink-0">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Etichetta / Nome (opzionale)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass-input rounded-xl px-4 py-2 text-white text-base"
            placeholder={editingId ? 'e.g. Specchio' : `e.g. Pezzo ${pieces.length + 1}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Larghezza (cm)
            </label>
            <input
              ref={widthInputRef}
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              className="w-full glass-input rounded-xl px-4 py-2 text-white text-base font-semibold font-mono"
              placeholder="Larghezza"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Altezza (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPiece(e);
                }
              }}
              className="w-full glass-input rounded-xl px-4 py-2 text-white text-base font-semibold font-mono"
              placeholder="Altezza"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Quantità
            </label>
            <div className="flex items-center rounded-xl bg-slate-900 border border-white/10 overflow-hidden h-9">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 hover:bg-white/5 text-gray-400 hover:text-white transition-colors h-full flex items-center justify-center font-bold text-base"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent text-center text-white text-base focus:outline-none py-1 border-0 ring-0 font-semibold font-mono"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-2.5 py-1 hover:bg-white/5 text-gray-400 hover:text-white transition-colors h-full flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>
          <div className="pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rotatable}
                onChange={(e) => setRotatable(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-white/10 bg-slate-900 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs font-semibold text-gray-300">Ruotabile (90°)</span>
            </label>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl py-2 font-semibold text-sm transition-all border border-white/5"
            >
              Annulla
            </button>
          )}
          <button
            type="submit"
            className={`flex-[2] flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold text-sm uppercase tracking-wider transition-all shadow-md ${editingId
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/10'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/15'
              }`}
          >
            {editingId ? <Check size={14} /> : <Plus size={14} />}
            {editingId ? 'Aggiorna' : 'Aggiungi'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="border-t border-white/5 my-4 shrink-0"></div>

      {/* Scrollable list of pieces */}
      <div className="flex-1 min-h-0 flex flex-col">
        {pieces.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-white/5 rounded-2xl flex flex-col justify-center items-center flex-grow bg-slate-900/10">
            <p className="text-sm font-semibold">Nessun pezzo inserito.</p>
            <p className="text-xs mt-1 text-gray-500 max-w-[180px] mx-auto leading-normal">Inserisci le dimensioni del pezzo sopra per aggiungerlo alla lista di taglio.</p>
          </div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${editingId === piece.id
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white text-sm truncate">
                      {piece.name}
                    </span>
                    {piece.rotatable ? (
                      <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                        <RotateCcw size={6} /> R
                      </span>
                    ) : (
                      <span className="text-[8px] bg-gray-500/10 border border-gray-500/20 text-gray-400 px-1 py-0.2 rounded shrink-0">
                        Bloccato
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-gray-300 font-mono">{piece.width} × {piece.height} cm</span>
                    <span className="text-gray-600">•</span>
                    <span className="font-mono">Area: {((piece.width * piece.height) / 10000).toFixed(2)} m²</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quantity Control */}
                  <div className="flex items-center bg-slate-900/60 border border-white/10 rounded-lg overflow-hidden h-7">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(piece.id, -1)}
                      className="px-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-1 text-white text-xs font-bold min-w-4 text-center font-mono">
                      {piece.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(piece.id, 1)}
                      className="px-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEditClick(piece)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 transition-all"
                      title="Modifica pezzo"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePiece(piece.id)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                      title="Elimina pezzo"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calcola CTA Button at the bottom of Piece list component */}
      <button
        type="button"
        onClick={onOptimize}
        disabled={pieces.length === 0 || isCalculating}
        className="mt-4 relative group w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl py-3 font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden shrink-0 h-10"
      >
        {isCalculating ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Calcolo in corso...</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="animate-pulse" />
            <span>Calcola Disposizione Ottimale</span>
          </>
        )}
      </button>

    </div>
  );
};
