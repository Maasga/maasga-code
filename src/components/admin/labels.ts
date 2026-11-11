// Libellés partagés entre les onglets admin (une seule source de vérité).

export const categoryLabels: Record<string, string> = {
  climatisation: 'Climatisation',
  ventilation: 'Ventilation',
  chambre_froide: 'Chambre froide',
  maintenance: 'Maintenance',
  commercial: 'Commercial',
  residentiel: 'Résidentiel'
}

export const ticketCategoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  panne: { label: 'Panne', icon: 'fa-exclamation-triangle', color: '#f87171' },
  garantie: { label: 'Garantie', icon: 'fa-shield-alt', color: '#60a5fa' },
  installation: { label: 'Installation', icon: 'fa-tools', color: '#a78bfa' },
  maintenance: { label: 'Maintenance', icon: 'fa-wrench', color: '#fbbf24' },
  reclamation: { label: 'Réclamation', icon: 'fa-flag', color: '#fb923c' },
  autre: { label: 'Autre', icon: 'fa-question-circle', color: '#94a3b8' }
}

export const ticketStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  ouvert: { label: 'Ouvert', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  en_cours: { label: 'En cours', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  attente_client: { label: 'Attente client', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  resolu: { label: 'Résolu', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  ferme: { label: 'Fermé', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
}

export const ticketPriorityLabels: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: '#94a3b8' },
  normal: { label: 'Normal', color: '#60a5fa' },
  haute: { label: 'Haute', color: '#fb923c' },
  urgente: { label: 'Urgente', color: '#f87171' }
}
