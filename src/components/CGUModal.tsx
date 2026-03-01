/// <reference lib="dom" />
import { CGU_TEXT } from '../data/cgu'

export const CGUModal = () => {
  return (
    <div id="cgu-modal" class="fixed inset-0 bg-black/80 backdrop-blur z-[999] hidden flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cgu-title">
      <div class="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-cyan-500/30">
        
        {/* Header */}
        <div class="bg-gradient-to-r from-blue-600 to-sky-500 p-6 border-b border-cyan-500/20">
          <h2 id="cgu-title" class="text-2xl font-bold text-white flex items-center space-x-3">
            <i class="fas fa-file-contract text-xl"></i>
            <span>Conditions & Politique</span>
          </h2>
          <p class="text-sm text-blue-50 mt-1">Veuillez lire et accepter avant de continuer</p>
        </div>

        {/* Scrollable Content */}
        <div class="flex-1 overflow-y-auto p-6 text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
          {CGU_TEXT.split('\n').map((line, idx) => (
            <div key={idx} class={line.startsWith('Article') ? 'font-bold text-white mt-4 mb-2' : ''}>
              {line}
            </div>
          ))}
        </div>

        {/* Footer with Checkbox & Buttons */}
        <div class="bg-slate-900/90 border-t border-cyan-500/20 p-6 space-y-4">
          <label class="flex items-center space-x-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
            <input 
              type="checkbox" 
              id="accept-cgu"
              class="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
            />
            <span class="text-sm font-medium text-gray-300">
              J'accepte les Conditions Générales d'Utilisation et la Politique de Confidentialité
            </span>
          </label>

          <div class="flex gap-3 pt-2">
            <button 
              onclick="document.getElementById('cgu-modal').classList.add('hidden')"
              class="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-slate-700 transition font-semibold"
            >
              <i class="fas fa-times mr-2"></i>Refuser
            </button>
            <button 
              onclick="window.acceptCGU()"
              class="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              id="accept-btn"
              disabled
            >
              <i class="fas fa-check mr-2"></i>J'accepte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const initCGUModal = () => {
  if (typeof window === 'undefined') return

  // Vérifier si l'utilisateur a déjà accepté
  const hasAccepted = localStorage.getItem('maasga_cgu_accepted')
  
  if (!hasAccepted) {
    setTimeout(() => {
      const modal = document.getElementById('cgu-modal')
      if (modal) modal.classList.remove('hidden')
    }, 500)
  }

  // Gérer l'état du bouton accepter
  const checkbox = document.getElementById('accept-cgu') as HTMLInputElement
  const acceptBtn = document.getElementById('accept-btn') as HTMLButtonElement
  
  if (checkbox && acceptBtn) {
    checkbox.addEventListener('change', () => {
      acceptBtn.disabled = !checkbox.checked
    })
  }

  // Fonction globale pour accepter les CGU
  (window as any).acceptCGU = () => {
    const checkbox = document.getElementById('accept-cgu') as HTMLInputElement
    if (checkbox?.checked) {
      localStorage.setItem('maasga_cgu_accepted', JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }))
      const modal = document.getElementById('cgu-modal')
      if (modal) modal.classList.add('hidden')
    }
  }
}
