// BulkActionsToolbar — Hono JSX SSR (pas React).
// La sélection et les actions en lot sont gérées par JS natif côté client.
// Ce composant n'est jamais rendu (selectedCount vient du state client) ;
// il est conservé pour compatibilité de l'import dans admin.tsx.

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onBulkStatusChange?: (status: string) => void;
  onBulkExport?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
}

export const BulkActionsToolbar = ({ selectedCount, totalCount }: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;
  return (
    <div class="flex items-center justify-between gap-4 px-4 py-3 rounded-xl" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.15);">
      <span class="text-sm font-medium text-white">
        {selectedCount} / {totalCount} commande{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
      </span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick="adminBulkAction('status')"
          class="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);"
        >
          <i class="fas fa-exchange-alt mr-1"></i>Statut en lot
        </button>
        <button
          type="button"
          onclick="adminBulkAction('export')"
          class="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style="background:rgba(59,130,246,0.12); color:#60a5fa; border:1px solid rgba(59,130,246,0.2);"
        >
          <i class="fas fa-file-export mr-1"></i>Exporter
        </button>
        <button
          type="button"
          onclick="adminBulkAction('delete')"
          class="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2);"
        >
          <i class="fas fa-trash mr-1"></i>Supprimer
        </button>
        <button
          type="button"
          onclick="adminClearSelection()"
          class="text-xs px-3 py-1.5 rounded-lg"
          style="background:rgba(148,163,184,0.08); color:#94a3b8; border:1px solid rgba(148,163,184,0.12);"
        >
          Effacer sélection
        </button>
      </div>
    </div>
  );
};
