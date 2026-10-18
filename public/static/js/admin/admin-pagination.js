// Admin Table Pagination Utility
window.adminPaginate = function() {
  document.querySelectorAll('tbody[data-paginate]').forEach(function(tbody) {
    var perPage = parseInt(tbody.dataset.paginate) || 20;
    var rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length <= perPage) return;
    var page = 1;
    var totalPages = Math.ceil(rows.length / perPage);

    // Create pagination container
    var pDiv = document.createElement('div');
    pDiv.className = 'flex items-center justify-center gap-2 flex-wrap mt-4 mb-2';
    var tableParent = tbody.closest('.overflow-x-auto') || tbody.closest('table').parentElement;
    tableParent.parentElement.insertBefore(pDiv, tableParent.nextSibling);

    function render() {
      rows.forEach(function(r, i) {
        var p = Math.floor(i / perPage) + 1;
        r.style.display = p === page ? '' : 'none';
      });
      var html = '';
      var btnBase = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ';
      var btnActive = 'background:linear-gradient(135deg,#2563eb,#0284c7); color:white;';
      var btnNormal = 'background:rgba(56,189,248,0.08); color:#93c5fd; border:1px solid rgba(56,189,248,0.15);';
      var btnOff = 'background:rgba(255,255,255,0.03); color:#475569; cursor:not-allowed;';
      html += '<button class="' + btnBase + '" style="' + (page<=1?btnOff:btnNormal) + '"' + (page<=1?' disabled':'') + ' data-pg="' + (page-1) + '"><i class="fas fa-chevron-left"></i></button>';
      for (var i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && i > 2 && i < totalPages-1 && Math.abs(i-page) > 1) {
          if (i===3||i===totalPages-2) html += '<span class="px-1" style="color:#475569;">…</span>';
          continue;
        }
        html += '<button class="' + btnBase + '" style="' + (i===page?btnActive:btnNormal) + '" data-pg="'+i+'">'+i+'</button>';
      }
      html += '<button class="' + btnBase + '" style="' + (page>=totalPages?btnOff:btnNormal) + '"' + (page>=totalPages?' disabled':'') + ' data-pg="' + (page+1) + '"><i class="fas fa-chevron-right"></i></button>';
      html += '<span class="text-xs ml-2" style="color:#64748b;">' + rows.length + ' éléments</span>';
      pDiv.innerHTML = html;
      pDiv.querySelectorAll('button[data-pg]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var np = parseInt(btn.dataset.pg);
          if (np >= 1 && np <= totalPages) { page = np; render(); }
        });
      });
    }
    render();
  });
};
document.addEventListener('DOMContentLoaded', function() { window.adminPaginate(); });
