import React, { useState, useEffect } from 'react';
import { Piece } from '../types/Piece';
import {
  Plus, Trash2, RotateCcw, Play, Save, FolderOpen, AlertCircle, Sparkles, Check, X, Edit2
} from 'lucide-react';

interface PieceFormProps {
  pieces: Piece[];
  setPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  sheetWidth: number;
  setSheetWidth: (w: number) => void;
  sheetHeight: number;
  setSheetHeight: (h: number) => void;
  globalRotation: boolean;
  setGlobalRotation: (r: boolean) => void;
  onOptimize: () => void;
  isCalculating: boolean;
}

interface CustomProject {
  name: string;
  sheetWidth: number;
  sheetHeight: number;
  globalRotation: boolean;
  pieces: Piece[];
}

const PREDEFINED_EXAMPLES: Record<string, CustomProject> = {
  'Progetto Infissi Standard': {
    name: 'Progetto Infissi Standard',
    sheetWidth: 240,
    sheetHeight: 300,
    globalRotation: true,
    pieces: [
      { id: '1', name: 'Finestra Soggiorno', width: 120, height: 140, quantity: 4, rotatable: true },
      { id: '2', name: 'Porta Finestra Cucina', width: 80, height: 210, quantity: 3, rotatable: true },
      { id: '3', name: 'Finestra Bagno', width: 60, height: 80, quantity: 6, rotatable: true },
      { id: '4', name: 'Vetro Sopraluce', width: 90, height: 40, quantity: 5, rotatable: true },
    ]
  },
  'Vetrina Negozio e Ripiani': {
    name: 'Vetrina Negozio e Ripiani',
    sheetWidth: 240,
    sheetHeight: 300,
    globalRotation: true,
    pieces: [
      { id: '1', name: 'Vetrata Principale', width: 220, height: 180, quantity: 1, rotatable: true },
      { id: '2', name: 'Ripiani Vetro Temperato', width: 110, height: 45, quantity: 12, rotatable: true },
      { id: '3', name: 'Porta Scorrevole', width: 95, height: 200, quantity: 2, rotatable: false },
      { id: '4', name: 'Pannelli Laterali', width: 40, height: 180, quantity: 4, rotatable: true },
    ]
  },
  'Cabine Doccia e Specchi': {
    name: 'Cabine Doccia e Specchi',
    sheetWidth: 240,
    sheetHeight: 300,
    globalRotation: true,
    pieces: [
      { id: '1', name: 'Pannello Doccia Fisso', width: 100, height: 200, quantity: 3, rotatable: true },
      { id: '2', name: 'Anta Doccia Battente', width: 75, height: 195, quantity: 3, rotatable: true },
      { id: '3', name: 'Specchio Bagno Grande', width: 140, height: 90, quantity: 2, rotatable: true },
      { id: '4', name: 'Mensoline Portaoggetti', width: 35, height: 15, quantity: 16, rotatable: true },
    ]
  }
};

export const PieceForm: React.FC<PieceFormProps> = ({
  pieces,
  setPieces,
  sheetWidth,
  setSheetWidth,
  sheetHeight,
  setSheetHeight,
  globalRotation,
  setGlobalRotation,
  onOptimize,
  isCalculating
}) => {
  // Input fields state
  const [name, setName] = useState('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [rotatable, setRotatable] = useState(true);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Saved custom projects state
  const [savedProjects, setSavedProjects] = useState<CustomProject[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load custom projects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('glass_optimizer_projects');
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddPiece = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handleEditClick = (piece: Piece) => {
    setEditingId(piece.id);
    setName(piece.name || '');
    setWidth(piece.width);
    setHeight(piece.height);
    setQuantity(piece.quantity);
    setRotatable(piece.rotatable);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setWidth('');
    setHeight('');
    setQuantity(1);
    setRotatable(true);
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

  const handleLoadProject = (project: CustomProject) => {
    setSheetWidth(project.sheetWidth);
    setSheetHeight(project.sheetHeight);
    setGlobalRotation(project.globalRotation);
    setPieces(project.pieces);
    handleCancelEdit();
    setErrorMsg('');
  };

  const handleSaveProject = () => {
    if (!saveName.trim()) return;
    const newProj: CustomProject = {
      name: saveName.trim(),
      sheetWidth,
      sheetHeight,
      globalRotation,
      pieces
    };
    const updated = [...savedProjects.filter(p => p.name !== newProj.name), newProj];
    setSavedProjects(updated);
    localStorage.setItem('glass_optimizer_projects', JSON.stringify(updated));
    setSaveName('');
    setShowSaveModal(false);
  };

  const handleDeleteSavedProject = (projName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Sei sicuro di voler eliminare "${projName}"?`)) {
      const updated = savedProjects.filter(p => p.name !== projName);
      setSavedProjects(updated);
      localStorage.setItem('glass_optimizer_projects', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dimensioni Lastra di Partenza */}
      <div className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <FolderOpen size={18} />
          </span>
          Lastra Standard di Partenza
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Larghezza (cm)
            </label>
            <input
              type="number"
              value={sheetWidth}
              onChange={(e) => setSheetWidth(Math.max(10, Number(e.target.value)))}
              className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm"
              placeholder="e.g. 240"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Altezza (cm)
            </label>
            <input
              type="number"
              value={sheetHeight}
              onChange={(e) => setSheetHeight(Math.max(10, Number(e.target.value)))}
              className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm"
              placeholder="e.g. 300"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={globalRotation}
              onChange={(e) => setGlobalRotation(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-white/10 bg-slate-900 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm font-medium text-gray-300">Consenti rotazione a 90°</span>
          </label>
          <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
            Area Lastra: {((sheetWidth * sheetHeight) / 10000).toFixed(2)} m²
          </span>
        </div>
      </div>


      {/* 3. Inserimento Pezzi */}
      <div className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Plus size={18} />
          </span>
          {editingId ? 'Modifica Pezzo' : 'Aggiungi Pezzo'}
        </h2>

        <form onSubmit={handleAddPiece} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Etichetta / Nome (opzionale)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-white text-sm"
              placeholder={editingId ? 'e.g. Porta doccia' : `e.g. Pezzo ${pieces.length + 1}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Larghezza (cm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-white text-sm"
                placeholder="Larghezza"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Altezza (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-white text-sm"
                placeholder="Altezza"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Quantità
              </label>
              <div className="flex items-center rounded-xl bg-slate-900 border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3 py-2.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={12} className="rotate-45" /> {/* simple minus */}
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-transparent text-center text-white text-sm focus:outline-none py-1 border-0 ring-0"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3 py-2.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rotatable}
                  onChange={(e) => setRotatable(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-white/10 bg-slate-900 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm font-medium text-gray-300">Ruotabile (90°)</span>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl py-3 font-semibold text-sm transition-all"
              >
                Annulla
              </button>
            )}
            <button
              type="submit"
              className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm transition-all shadow-md ${editingId
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/10'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/15'
                }`}
            >
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              {editingId ? 'Aggiorna Pezzo' : 'Aggiungi Pezzo'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Lista Pezzi */}
      <div className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Elenco Pezzi da Tagliare
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-normal">
              {pieces.reduce((acc, p) => acc + p.quantity, 0)} totali
            </span>
          </h2>
          {pieces.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 bg-red-500/10 border border-red-500/10 px-2.5 py-1 rounded-lg hover:border-red-500/25 transition-all"
            >
              <Trash2 size={12} /> Svuota
            </button>
          )}
        </div>

        {pieces.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm">Nessun pezzo inserito.</p>
            <p className="text-xs mt-1">Carica un progetto predefinito o inserisci il tuo primo pezzo sopra per iniziare.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${editingId === piece.id
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm truncate">
                      {piece.name}
                    </span>
                    {piece.rotatable ? (
                      <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <RotateCcw size={8} /> R
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-500/10 border border-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded-md">
                        Bloccato
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <span className="font-medium text-gray-300">{piece.width} x {piece.height} cm</span>
                    <span className="text-gray-600">•</span>
                    <span>Area: {((piece.width * piece.height) / 10000).toFixed(2)} m²</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Quantity Control */}
                  <div className="flex items-center bg-slate-900 border border-white/10 rounded-lg overflow-hidden h-8">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(piece.id, -1)}
                      className="px-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      -
                    </button>
                    <span className="px-2 text-white text-xs font-semibold min-w-5 text-center">
                      {piece.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(piece.id, 1)}
                      className="px-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEditClick(piece)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 transition-all"
                      title="Modifica pezzo"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePiece(piece.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                      title="Elimina pezzo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Calcola Ottimizzazione Big CTA */}
      <button
        type="button"
        onClick={onOptimize}
        disabled={pieces.length === 0 || isCalculating}
        className="relative group w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-40 disabled:pointer-events-none text-white rounded-2xl py-4 font-bold text-base shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
      >
        <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        {isCalculating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Ottimizzazione in corso...</span>
          </div>
        ) : (
          <>
            <Sparkles size={18} className="animate-pulse" />
            <span>Calcola Disposizione Ottimale</span>
          </>
        )}
      </button>
    </div>
  );
};
