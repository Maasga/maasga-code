# Admin Data Visibility Audit — MAASGA Back-Office

**Date:** Investigation completed  
**Scope:** All admin components and pages under `src/components/admin/` and `src/pages/admin.tsx`

---

## Executive Summary

The admin back-office has **multiple significant data visibility gaps** across all major sections. The core problems are:

1. **`OrderDetailModal`** is missing 7 out of 14 Order fields, including product info, order type, quantity, installation price, and delivery/installation timestamps.
2. **`CommandesTable`** truncates the entire "Produit / Notes" column (`max-w-[200px] truncate`) and hides 2 columns on mobile/tablet (`#ID` on `<lg`, `Date` + `Actions` on `<sm`).
3. **`ClientDetailModal` (component)** is a dummy SSR placeholder — it is rendered with `client={null}` and `isOpen={false}`, so it **never displays anything** in production. The real client modal lives inline in `admin.tsx` (the `order-client-detail-modal` div) and the clients page.
4. **Avis/Reviews table** truncates the comment column (`max-w-xs truncate`).
5. **Maintenance table** truncates the description column (`max-w-xs truncate`).
6. **Audit Log details column** is truncated (`max-w-xs truncate`).
7. **Client history modal** only loads on a separate "Historique" tab click — visits notes, RDV notes, and SAV descriptions are not shown inline.
8. **RDV page** — `adresse_precise` and GPS coordinates are only shown in the detail popup, not in the main list.
9. **SAV ticket list** — `subject` is `truncate` class, message count / last reply date not shown in the list.
10. **Data-search index in CommandesTable** omits `quartier`, `type`, `status`, `client_email`, `appointment_id` — admin can't search by these fields.

---

## Detailed Findings

---

### ISSUE 1 — OrderDetailModal: 7 missing Order fields

**File:** `src/components/admin/OrderDetailModal.tsx`, lines 52–82  
**Severity:** High

**Data model** (`src/data/store.ts`, `Order` interface) has 14+ fields. The modal renders only:
`id`, `client_name`, `client_phone`, `client_email`, `quartier`, `total_price`, `status`, `notes`, `created_at`

**Missing fields — not rendered anywhere in the modal:**

| Field | Description | Impact |
|---|---|---|
| `type` | `'devis' | 'installation' | 'vente' | 'commande'` | Admin can't see how the order came in |
| `product_id` | Which product was ordered | Critical: no product reference shown |
| `quantity` | Number of units | Invisible to admin |
| `installation_price` | Separate installation cost | Revenue reporting incomplete |
| `delivered_at` | Delivery timestamp | Delivery tracking impossible |
| `installed_at` | Installation timestamp | Installation tracking impossible |
| `delivery_confirmed_by` | Staff name | Accountability gap |
| `installation_confirmed_by` | Staff name | Accountability gap |
| `appointment_id` | Linked RDV | Can't trace back to source RDV |
| `client_id` | Linked client account | No link to client profile from order |

**Specific CSS/code causing issue:** These fields simply don't exist in the JSX — they're available in the `order` prop but never rendered.

**Suggested fix:** Add a second section to the modal body showing product/order details:
```tsx
{/* Détails commande */}
<div class="grid grid-cols-2 gap-4">
  <div>
    <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Type</p>
    <p class="text-sm" style="color: var(--admin-text-primary);">{order.type}</p>
  </div>
  {order.product_id && (
    <div>
      <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Produit ID</p>
      <p class="text-sm font-mono" style="color: var(--admin-text-primary);">#{order.product_id}{order.quantity ? ` × ${order.quantity}` : ''}</p>
    </div>
  )}
  {order.installation_price && (
    <div>
      <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Prix installation</p>
      <p class="text-sm font-bold" style="color: var(--admin-accent);">{order.installation_price.toLocaleString('fr-FR')} F</p>
    </div>
  )}
  {order.delivered_at && (
    <div>
      <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Livré le</p>
      <p class="text-sm" style="color: var(--admin-text-primary);">{new Date(order.delivered_at).toLocaleDateString('fr-FR')}</p>
    </div>
  )}
  {order.installed_at && (
    <div>
      <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Installé le</p>
      <p class="text-sm" style="color: var(--admin-text-primary);">{new Date(order.installed_at).toLocaleDateString('fr-FR')}</p>
    </div>
  )}
  {order.client_id && (
    <div>
      <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Fiche client</p>
      <a href={`/admin/clients?id=${order.client_id}`} class="text-xs text-blue-400 hover:underline">Client #{order.client_id}</a>
    </div>
  )}
</div>
```

---

### ISSUE 2 — CommandesTable: "Produit / Notes" column is truncated

**File:** `src/components/admin/CommandesTable.tsx`, line 105  
**Severity:** High

```tsx
<td class="py-3 px-4 text-xs max-w-[200px] truncate hidden md:table-cell" style="color: var(--admin-text-muted);">
  {order.notes || '—'}
</td>
```

**Classes causing truncation:** `max-w-[200px] truncate`  
**Effect:** Any note longer than ~30 characters is cut off with an ellipsis. This column is also hidden on mobile (`hidden md:table-cell`). Since `notes` is the primary field that describes the product requested and any client requirements, truncation here is particularly damaging.

**Suggested fix:** Replace `truncate` with a tooltip or expandable approach, or use `title` attribute:
```tsx
<td class="py-3 px-4 text-xs max-w-[240px] hidden md:table-cell" style="color: var(--admin-text-muted);">
  <span title={order.notes || ''} class="block overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
    {order.notes || '—'}
  </span>
</td>
```
Or increase the column width and allow 2-line wrapping instead of hard truncation.

---

### ISSUE 3 — CommandesTable: columns hidden on small screens with no fallback

**File:** `src/components/admin/CommandesTable.tsx`, lines 70–75 (headers) and corresponding `<td>` cells  
**Severity:** Medium

| Column | Visibility class | Hidden on |
|---|---|---|
| `#ID` | `hidden lg:table-cell` | all screens < lg (< 1024px) |
| `Produit / Notes` | `hidden md:table-cell` | mobile (< 768px) |
| `Date` | `hidden sm:table-cell` | mobile (< 640px) |
| `Actions` | `hidden sm:table-cell` | mobile (< 640px) |

On a tablet or medium screen, an admin sees only: Client, Montant, Statut. The ID, notes, date, and action buttons are invisible with no way to access them. While this is intentional responsive design, critical columns like Date and Actions should still be accessible on tablet.

**Suggested fix:** Show `Date` on `md:` and keep `Actions` visible from `xs`. At minimum add `md:table-cell` to `Actions` column.

---

### ISSUE 4 — CommandesTable: data-search index is incomplete

**File:** `src/components/admin/CommandesTable.tsx`, line 93  
**Severity:** Medium

```tsx
data-search={`${order.client_name} ${order.client_phone} ${order.notes || ''} ${order.total_price || ''}`}
```

**Missing from search index:** `order.quartier`, `order.type`, `order.status`, `order.client_email`, `order.id` (CMD number)

An admin cannot search for "Paspanga" to find orders by quartier, or search "vente" to filter by order type, or type a CMD reference number.

**Suggested fix:**
```tsx
data-search={`${order.client_name} ${order.client_phone} ${order.client_email || ''} ${order.notes || ''} ${order.quartier || ''} ${order.type || ''} ${order.status} CMD-${String(order.id).padStart(4,'0')}`}
```

---

### ISSUE 5 — ClientDetailModal component is non-functional (always null)

**File:** `src/components/admin/ClientDetailModal.tsx` (whole file) and `src/pages/admin.tsx` lines 4173–4177 and 6458–6461  
**Severity:** High (architectural)

The `ClientDetailModal` component is imported and rendered in both `AdminCommandesPage` and `AdminMaintenancePage` with hardcoded `client={null}` and `isOpen={false}`:

```tsx
// admin.tsx line 4173
<ClientDetailModal
  client={null}      // ← always null
  isOpen={isClientDetailOpen}   // ← always false (SSR, no useState)
  onClose={handleCloseClientDetail}
/>
```

Since this is Hono SSR (not React), `isClientDetailOpen` is always `false` and `client` is always `null`, so the component returns `null` immediately on every render.

The **actual working client modals** are different:
- On the Clients page: the `order-client-detail-modal` div (inline in `admin.tsx` around line 3800) populated via JS `showClientDetail()`.
- On the RDV page: the RDV detail popup that makes a live API call to `/api/admin/clients/by-phone`.

The `ClientDetailModal` component in `src/components/admin/ClientDetailModal.tsx` is dead code — never displayed.

**Missing fields in the ClientDetailModal component itself** (even if it were shown):
- `type_demande` (source/origin of the client)
- `password_hash` (obviously should NOT be shown, but the field exists)
- Order history (count of orders, links to them)
- RDV history (count and links)
- Maintenance contracts

**Suggested fix:** Either wire up the component properly (make `isClientDetailOpen` and `client` dynamic using SSR-compatible patterns like `data-*` attributes + JS), or remove the dead import and only use the inline modal + JS approach that already works.

---

### ISSUE 6 — Avis (Reviews) table: comment column truncated

**File:** `src/pages/admin.tsx`, line 4679  
**Severity:** Medium

```tsx
<td class="py-3 px-4 text-xs max-w-xs truncate italic hidden md:table-cell" style="color:var(--admin-text-muted)">"{r.comment}"</td>
```

**Classes causing truncation:** `max-w-xs truncate`  
**Effect:** Review comments are cut off. Admins may approve or reject a review without seeing its full text. The comments in the "En attente" section above the table render full text, but in the published reviews table they're truncated.

**Suggested fix:** Use `line-clamp-2` (2 lines) or a tooltip, or a "voir plus" expand button per row.

---

### ISSUE 7 — Maintenance table: description column truncated + hidden

**File:** `src/pages/admin.tsx`, line 5927  
**Severity:** Medium

```tsx
<td class="px-5 py-3 text-xs max-w-xs truncate hidden lg:table-cell" style="color:var(--admin-text-muted);">{r.description || '—'}</td>
```

**Classes causing truncation:** `max-w-xs truncate`  
Also hidden on `< lg` (`hidden lg:table-cell`).

The `description` field of a `MaintenanceRequest` is the admin's primary source of information about what the client needs. Both truncation and the `hidden lg:table-cell` mean that on a laptop screen (1280px), the admin sees client name, type, formule, price, status, date, actions — but not the actual problem description.

**Suggested fix:** Add an expand/tooltip mechanism. For a table with few columns, remove `truncate` and allow wrapping:
```tsx
<td class="px-5 py-3 text-xs hidden lg:table-cell" style="color:var(--admin-text-muted); max-width:240px; word-break:break-word;">{r.description || '—'}</td>
```

---

### ISSUE 8 — Maintenance contracts: notes truncated

**File:** `src/pages/admin.tsx`, line 6056  
**Severity:** Low

```tsx
{c.notes && <div class="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{c.notes}</div>}
```

Contract notes are truncated with `max-w-xs truncate`. On contracts where notes contain important terms or conditions, this information is cut off.

---

### ISSUE 9 — Maintenance visits: `actions_performed` truncated

**File:** `src/pages/admin.tsx`, line 6181  
**Severity:** Medium

```tsx
{v.actions_performed && <span class="text-xs truncate max-w-[140px]" style="color:#94a3b8;">{v.actions_performed}</span>}
```

Visit action logs are truncated to 140px. The `actions_performed` field in `MaintenanceVisit` is the record of what was done during a technical visit — this is important for warranty claims and maintenance history.

**Suggested fix:** Remove `truncate`, show full text, or add a tooltip (`title={v.actions_performed}`).

---

### ISSUE 10 — Audit Log: details column truncated

**File:** `src/pages/admin.tsx`, line 7183  
**Severity:** Low

```tsx
<td class="py-3 px-4 max-w-xs truncate hidden md:table-cell" style="color:var(--admin-text-muted)">{l.details || '-'}</td>
```

Audit log details are truncated. While this is lower-severity for routine review, when investigating incidents the details field may contain important context that is hidden.

---

### ISSUE 11 — SAV ticket list: subject truncated, no message count shown

**File:** `src/pages/admin.tsx`, line 6924  
**Severity:** Medium

```tsx
<h3 class="font-semibold text-sm truncate" style="color:var(--admin-text-primary)">{t.subject}</h3>
```

Ticket subjects can be long and are cut off. Additionally:
- **No message/reply count** is shown in the ticket list (number of messages in the thread)
- **No last reply date/author** — only `created_at` is shown; if a ticket was replied to last week, admin sees the original creation date
- **No `client_id`** link — if a phone number matches a registered client, there's no link to their profile
- `product_info` is shown only when present, but `client_email` (if any) is not shown

**Suggested fix:**
```tsx
<h3 class="font-semibold text-sm" style="color:var(--admin-text-primary); word-break:break-word;">{t.subject}</h3>
```
Add message count badge next to the ticket reference.

---

### ISSUE 12 — RDV list: `adresse_precise` and GPS not accessible from list view

**File:** `src/pages/admin.tsx`, lines 3213–3232 (RDV card rendering)  
**Severity:** Medium

The main RDV list renders: name, phone, quartier, date, heure, type, notes.

Not shown in the list card:
- `adresse_precise` (precise address — only shown in detail popup)
- `latitude` / `longitude` (GPS coordinates — only shown in detail popup)

Since these are key for technicians dispatching to a site, an admin checking the list has to click every card to open the popup just to see the address.

**Suggested fix:** Show `adresse_precise` as a secondary line under `quartier` in the list, with an icon:
```tsx
{a.adresse_precise && <span><i class="fas fa-location-arrow mr-1 text-blue-400"></i>{a.adresse_precise}</span>}
```

---

### ISSUE 13 — Client history modal: visit notes and checklist not shown

**File:** `src/pages/admin.tsx`, lines 3985–4010 (JS `loadClientHistory` function, visits section)  
**Severity:** Medium

In the client detail modal's "Historique" tab, visits are rendered with only:
`visit_type`, `visit_date`, `technician`, `status`

Not rendered:
- `v.notes` — the technician's visit notes
- `v.actions_performed` — what actions were taken
- `v.checklist_data` — the checklist result

```js
// Current visit rendering (lines ~3991-3998):
return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" ...>'
  + '<div><span class="font-semibold">' + (x.visit_type==='preventive'?'Préventive':'Corrective') + '</span>'
  + '<span class="ml-2">' + _esc(x.visit_date||'') + '</span>'
  + (x.technician ? '<span class="ml-2">— ' + _esc(x.technician) + '</span>' : '') + '</div>'
  + '<span ...>' + status + '</span></div>';
// Missing: x.notes, x.actions_performed, x.checklist_data
```

**Suggested fix:** Add a notes/actions row in the visit card:
```js
+ (x.notes ? '<div class="mt-1 text-gray-400 italic">' + _esc(x.notes) + '</div>' : '')
+ (x.actions_performed ? '<div class="mt-0.5 text-gray-500">' + _esc(x.actions_performed) + '</div>' : '')
```

---

### ISSUE 14 — CommandesKPIs: "Payées" KPI conflates pending statuses

**File:** `src/components/admin/CommandesKPIs.tsx`, lines 14–17  
**Severity:** Low

```ts
const paidOrders = orders.filter(o =>
  o.status === 'confirme' || o.status === 'en_livraison' || o.status === 'livre'
).length;
```

The "Payées" KPI card shows orders that are `confirme`, `en_livraison`, or `livre`. But `confirme` and `en_livraison` are not yet delivered — they're just confirmed. This is a data accuracy issue: the KPI label says "Payées" but it counts undelivered orders.

The `CommandesKPIs` component does not receive payments data (even though the parent page has it), so it cannot show actual payment status.

**Suggested fix:** Either rename the KPI to "Confirmées" or pass payment data as a prop so the KPI can filter on `payment.status === 'completed'`.

---

### ISSUE 15 — OrderDetailModal: no payment status shown

**File:** `src/components/admin/OrderDetailModal.tsx` (whole file)  
**Severity:** High

The `OrderDetailModal` props include no payment data. The `CommandesTable` shows payment status inline per row (via `paymentsByOrder`), but when the admin opens the detail modal, there is no payment section — no payment status, no payment method, no payment reference, no payment date.

**Suggested fix:** Pass a `payment` prop to `OrderDetailModal` and add a payment section:
```tsx
interface OrderDetailModalProps {
  order: Order | null;
  payment?: any; // payment record if exists
  isOpen: boolean;
  ...
}
// In the modal body:
{payment && (
  <div>
    <p class="text-xs mb-2" style="color: var(--admin-text-muted);">Paiement</p>
    <div class="flex items-center gap-3">
      <span ...>{payment.status === 'completed' ? 'Payé' : 'En attente'}</span>
      {payment.method && <span ...>{payment.method}</span>}
      {payment.reference && <span class="font-mono text-xs">{payment.reference}</span>}
    </div>
  </div>
)}
```

---

### ISSUE 16 — Client detail modal: RDV notes and SAV descriptions not shown in history

**File:** `src/pages/admin.tsx`, lines 3998–4013 (JS `loadClientHistory`, rdvs and sav sections)  
**Severity:** Medium

**RDVs section** renders: `type`, `date`, `heure_debut`, `status`. Missing: `notes`, `quartier`, `adresse_precise`.

**SAV section** renders: `ticket_ref`, `priority`, `status`. Missing: `subject`, `description` (the first message), `resolved_at`.

```js
// SAV rendering only shows:
'<span class="font-semibold">' + _esc(x.ticket_ref||'#'+x.id) + '</span>'
+ '<span>' + _esc(x.priority||'') + '</span>'
// Missing: subject, description, status label
```

**Suggested fix:** Add subject display and resolved date:
```js
+ '<div style="color:var(--admin-text-muted)">' + _esc(x.subject||'') + '</div>'
+ (x.resolved_at ? '<div class="text-green-400">Résolu: ' + x.resolved_at.substring(0,10) + '</div>' : '')
```

---

## Summary Table

| # | File | Issue | Severity | CSS / Code Cause |
|---|---|---|---|---|
| 1 | `OrderDetailModal.tsx` | 7 Order fields not rendered | 🔴 High | Fields simply absent from JSX |
| 2 | `CommandesTable.tsx:105` | Notes column truncated | 🔴 High | `max-w-[200px] truncate` |
| 3 | `CommandesTable.tsx:70-75` | 4 columns hidden on tablet/mobile | 🟡 Medium | `hidden lg/md/sm:table-cell` |
| 4 | `CommandesTable.tsx:93` | Search index misses 5 fields | 🟡 Medium | Incomplete `data-search` string |
| 5 | `ClientDetailModal.tsx` | Component always renders null | 🔴 High | `client={null}` `isOpen={false}` always |
| 6 | `admin.tsx:4679` | Avis comment truncated | 🟡 Medium | `max-w-xs truncate` |
| 7 | `admin.tsx:5927` | Maintenance description truncated | 🟡 Medium | `max-w-xs truncate hidden lg:table-cell` |
| 8 | `admin.tsx:6056` | Contract notes truncated | 🟢 Low | `truncate max-w-xs` |
| 9 | `admin.tsx:6181` | Visit `actions_performed` truncated | 🟡 Medium | `truncate max-w-[140px]` |
| 10 | `admin.tsx:7183` | Audit log details truncated | 🟢 Low | `max-w-xs truncate` |
| 11 | `admin.tsx:6924` | SAV subject truncated, no reply count | 🟡 Medium | `truncate` |
| 12 | `admin.tsx:3213` | RDV precise address not in list | 🟡 Medium | Fields not rendered in card |
| 13 | `admin.tsx:~3991` | Visit notes/actions missing in client history | 🟡 Medium | JS template missing fields |
| 14 | `CommandesKPIs.tsx:14` | "Payées" KPI mislabeled | 🟢 Low | Logic issue, not display |
| 15 | `OrderDetailModal.tsx` | No payment status in order modal | 🔴 High | Props/fields absent |
| 16 | `admin.tsx:3998-4013` | RDV notes + SAV subject missing in client history | 🟡 Medium | JS template missing fields |

---

## Priority Recommendations

### Immediate (High priority)

1. **Add missing Order fields to `OrderDetailModal`** — product, type, quantity, installation_price, delivery/installation timestamps, payment status. This is the most-used admin modal.

2. **Fix `CommandesTable` notes truncation** — replace `max-w-[200px] truncate` with 2-line clamp or full-width wrapping. Notes are the primary product description.

3. **Remove dead `ClientDetailModal` import/render** from `AdminCommandesPage` and `AdminMaintenancePage` (it does nothing). Ensure the inline `order-client-detail-modal` in admin.tsx is the single source of truth.

4. **Add payment data to OrderDetailModal** — pass the payment record as a prop and show status/reference/method.

### Medium priority

5. **Add `title` tooltip to all truncated columns** — at minimum add a `title={fullValue}` attribute so admins can hover to see full content.

6. **Expand `data-search` in CommandesTable** to include quartier, type, CMD number, email.

7. **Show `adresse_precise` in RDV list cards** if present — avoids forcing a popup click per appointment.

8. **Add visit notes and actions_performed** to the client history popup.

### Low priority

9. Remove `truncate` from audit log details and contract notes — these are read-rarely but important when needed.

10. Rename CommandesKPIs "Payées" to "Confirmées" to accurately reflect what the count means.
