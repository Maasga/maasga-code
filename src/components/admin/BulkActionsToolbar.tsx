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
    <div class="flex items-center justify-between gap-4 px-4 py-3 rounded-xl" style="background: var(--admin-accent-light); border: 1px solid var(--admin-border)">
      <span class="text-sm font-medium" style="color: var(--admin-text-primary);">
        {selectedCount} / {totalCount} commande{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
      </span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick="adminBulkAction('status')"
          class="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style="background: var(--admin-warning-light); color: var(--admin-warning); border: 1px solid rgba(217,119,6,0.25);"
        >
          <i class="fas fa-exchange-alt mr-1"></i>Statut en lot
        </button>
        <button
          type="button"
          onclick="adminBulkAction('export')"
          class="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style="background: var(--admin-info-light); color: var(--admin-info); border: 1px solid rgba(37,99,235,0.25);"
        >
          <i class="fas fa-file-export mr-1"></i>Exporter
        </button>
        <button
          type="button"
          onclick="adminBulkAction('delete')"
          class="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style="background: var(--admin-danger-light); color: var(--admin-danger); border: 1px solid rgba(220,38,38,0.25);"
        >
          <i class="fas fa-trash mr-1"></i>Supprimer
        </button>
        <button
          type="button"
          onclick="adminClearSelection()"
          class="text-xs px-3 py-1.5 rounded-lg"
          style="background: var(--admin-bg-elevated); color: var(--admin-text-muted);"
        >
          Effacer sélection
        </button>
      </div>
    </div>
  );
};
