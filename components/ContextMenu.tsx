
import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  targetId: string | number;
  onSetTransformMode: (mode: 'translate' | 'scale') => void;
  onDeleteObject: (id: string | number) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, targetId, onSetTransformMode, onDeleteObject }) => {
  return (
    <div
      style={{ top: y, left: x }}
      className="absolute z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg p-1 font-mono text-sm"
      // Stop propagation to prevent the main div's onClick from closing the menu when clicking on the menu's background
      onClick={(e) => e.stopPropagation()} 
      onContextMenu={(e) => e.preventDefault()}
    >
        <button
            onClick={() => onSetTransformMode('translate')}
            className="w-full text-left px-3 py-1 text-cyan-300 hover:bg-cyan-500/20 rounded-sm transition-colors"
        >
            Move
        </button>
        <button
            onClick={() => onSetTransformMode('scale')}
            className="w-full text-left px-3 py-1 text-cyan-300 hover:bg-cyan-500/20 rounded-sm transition-colors"
        >
            Scale
        </button>
        <button
            onClick={() => onDeleteObject(targetId)}
            className="w-full text-left px-3 py-1 text-red-400 hover:bg-red-500/20 rounded-sm transition-colors"
        >
            Delete
        </button>
    </div>
  );
};
