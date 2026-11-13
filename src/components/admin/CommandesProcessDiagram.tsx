// CommandesProcessDiagram — Hono JSX SSR (pas React).
// Diagramme de processus statique — pas d'état interactif côté serveur.

const onlineSteps = ['Commande','Paiement','Livraison','Validation','Devis','Installation','SAV gratuit'];
const terrainSteps = ['RDV','Visite','Validation','Commande','Devis','Installation'];

export const CommandesProcessDiagram = (_props: { selectedOrderId?: number | null; onSelectOrder?: unknown }) => (
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="rounded-2xl p-4" style="background:rgba(var(--rgb-emerald),0.08); border:1px solid rgba(var(--rgb-emerald),0.2);">
      <h4 class="font-semibold mb-2 flex items-center space-x-2 text-sm" style="color:#6ee7b7;">
        <i class="fas fa-shopping-cart text-fg-on-dark-success"></i>
        <span>Processus achat en ligne</span>
      </h4>
      <div class="flex flex-wrap gap-1.5 items-center text-xs" style="color:#6ee7b7;">
        {onlineSteps.map((step, i) => (
          <>
            {i > 0 && <i class="fas fa-arrow-right text-[10px]" style="color:rgba(var(--rgb-emerald),0.4);"></i>}
            <span class="px-2 py-1 rounded-lg font-medium" style="background:rgba(var(--rgb-emerald),0.1); border:1px solid rgba(var(--rgb-emerald),0.2);">{step}</span>
          </>
        ))}
      </div>
    </div>

    <div class="rounded-2xl p-4" style="background:rgba(var(--rgb-blue),0.08); border:1px solid rgba(var(--rgb-blue),0.2);">
      <h4 class="font-semibold mb-2 flex items-center space-x-2 text-sm" style="color:#93c5fd;">
        <i class="fas fa-map-marked-alt text-fg-on-dark-info"></i>
        <span>Processus terrain (RDV)</span>
      </h4>
      <div class="flex flex-wrap gap-1.5 items-center text-xs" style="color:#93c5fd;">
        {terrainSteps.map((step, i) => (
          <>
            {i > 0 && <i class="fas fa-arrow-right text-[10px]" style="color:rgba(var(--rgb-blue),0.4);"></i>}
            <span class="px-2 py-1 rounded-lg font-medium" style="background:rgba(var(--rgb-blue),0.1); border:1px solid rgba(var(--rgb-blue),0.2);">{step}</span>
          </>
        ))}
      </div>
    </div>
  </div>
);
