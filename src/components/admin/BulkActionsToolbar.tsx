import { useState } from 'react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onBulkStatusChange: (status: string) => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  totalCount,
  onBulkStatusChange,
  onBulkExport,
  onBulkDelete,
  onClearSelection
}: BulkActionsToolbarProps) => {
  const [bulkActionType, setBulkActionType] = useState<'status' | 'export' | 'delete'>('status');

  const handleBulkAction = () => {
    switch (bulkActionType) {
      case 'status':
        // Show status selection modal/dropdown
        alert(`Changing status for ${selectedCount} selected orders`);
        onBulkStatusChange('confirme'); // Example
        break;
      case 'export':
        onBulkExport();
        break;
      case 'delete':
        if (window.confirm(`Supprimer définitivement ${selectedCount} commande(s) sélectionnée(s) ? Cette action est irréversible.`)) {
          onBulkDelete();
        }
        break;
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="border-t pt-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <i className="fas fa-boxes text-gray-400"></i>
          <span className="font-medium text-white">{selectedCount} / {totalCount} commande{sélectionnée}s</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-1">Action en lot</label>
            <select
              value={bulkActionType}
              onChange={(e) => setBulkActionType(e.target.value as 'status' | 'export' | 'delete')}
              className="w-48 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800/50 text-white"
            >
              <option value="status">Changer le statut</option>
              <option value="export">Exporter</option>
              <option value="delete">Supprimer</option>
            </select>
          </div>

          <button
            onClick={handleBulkAction}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedCount === 0}
          >
            {bulkActionType === 'status' && (
              <>
                <i className="fas fa-exchange-alt mr-1"></i>
                Appliquer le statut
              </>
            )}
            {bulkActionType === 'export' && (
              <>
                <i className="fas fa-file-export mr-1"></i>
                Exporter sélection
              </>
            )}
            {bulkActionType === 'delete' && (
              <>
                <i className="fas fa-trash mr-1"></i>
                Supprimer sélection
              </>
            )}
          </button>

          <button
            onClick={onClearSelection}
            className="text-xs px-3 py-1 rounded border text-gray-400 hover:text-white hover:border-gray-600"
          >
            Effacer sélection
          </div>
        </div>
      </div>
    </div>
  );
};