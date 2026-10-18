# MaasGa Admin — Spécification des Endpoints API Backend

> **Base URL** : `https://maasga-website.pages.dev`
> **Auth** : Bearer token Firebase (`Authorization: Bearer <idToken>`)
> **Format** : JSON (`Content-Type: application/json`)

---

## 🔒 Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/mobile/login` | Connexion Firebase (retourne `idToken`) |
| `POST` | `/api/mobile/register` | Inscription utilisateur |
| `GET` | `/api/mobile/profile` | Profil de l'utilisateur connecté |
| `POST` | `/api/admin/set-admin-role` | Promotion rôle admin (super-admin only) |

---

## 📊 Dashboard Admin

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin-dashboard` | Stats globales : commandes, RDV, CA, clients |

**Réponse** :
```json
{
  "totalOrders": 128,
  "totalRevenue": 5420000,
  "pendingOrders": 12,
  "totalClients": 87,
  "todayAppointments": 3,
  "pendingMessages": 5
}
```

---

## 📅 Rendez-vous (RDV)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/rdv` | Liste tous les RDV |
| `GET` | `/api/mobile/admin/rdv/{id}` | Détail d'un RDV |
| `POST` | `/api/mobile/rdv` | Créer un RDV |
| `PATCH` | `/api/mobile/admin/rdv/{id}/confirm` | Confirmer un RDV |
| `PATCH` | `/api/mobile/admin/rdv/{id}/cancel` | Annuler un RDV |
| `GET` | `/api/mobile/admin/rdv/calendar` | Vue calendrier (format `{date: [rdvs]}`) |

**Statuts RDV** : `pending` | `confirmed` | `done` | `cancelled`

**Corps PATCH `/confirm`** :
```json
{ "technician_id": "abc123", "notes": "RDV confirmé" }
```

---

## 📦 Commandes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/orders` | Liste toutes les commandes |
| `GET` | `/api/mobile/admin/orders/{id}` | Détail d'une commande |
| `PATCH` | `/api/mobile/orders/{id}` | Modifier le statut |
| `POST` | `/api/mobile/admin/orders/{id}/notes` | Ajouter notes admin |
| `GET` | `/api/mobile/admin/orders/stats` | Statistiques commandes |

**Statuts Commande** : `en_attente` | `confirme` | `en_livraison` | `livre` | `installe` | `annule`

**Corps PATCH statut** :
```json
{ "status": "confirme" }
```

**Réponse `/stats`** :
```json
{
  "total": 128,
  "pending": 12,
  "confirmed": 34,
  "delivered": 82
}
```

---

## 🧾 Devis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/devis` | Liste des devis |
| `GET` | `/api/mobile/admin/devis/{id}` | Détail d'un devis |
| `POST` | `/api/mobile/admin/devis` | Créer un devis |
| `PATCH` | `/api/mobile/admin/devis/{id}/status` | Changer le statut |
| `POST` | `/api/mobile/admin/devis/{id}/convert` | Convertir en commande |
| `GET` | `/api/mobile/admin/devis/stats` | Statistiques devis |

**Statuts Devis** : `draft` | `sent` | `accepted` | `rejected`

**Corps POST création** :
```json
{
  "client_name": "Kouadio Yao",
  "client_phone": "+22507000000",
  "quartier": "Cocody",
  "product_name": "Climatiseur 12000 BTU",
  "amount": 350000,
  "status": "draft",
  "order_id": "optional-order-id",
  "notes": "Devis depuis commande #123"
}
```

---

## 💰 Paiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/payments` | Liste des paiements (filtres: `status`, `search`, `limit`, `offset`) |
| `GET` | `/api/mobile/admin/payments/{id}` | Détail d'un paiement |
| `POST` | `/api/mobile/admin/payments` | Créer un paiement manuel |
| `PATCH` | `/api/mobile/admin/payments/{id}/status` | Valider/Rembourser |
| `GET` | `/api/mobile/admin/payments/stats` | Stats paiements |

**Statuts Paiement** : `pending` | `completed` | `failed` | `refunded`

**Corps PATCH statut** :
```json
{ "status": "completed" }
```

**Réponse `/stats`** :
```json
{
  "total": { "count": 128, "amount": 5420000 },
  "pending": { "count": 12, "amount": 420000 },
  "failed": { "count": 3, "amount": 87000 },
  "today": { "count": 4, "amount": 150000 }
}
```

---

## 🛠️ Maintenance

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/maintenance/summary` | Résumé global |
| `GET` | `/api/mobile/admin/maintenance/contracts` | Liste des contrats |
| `GET` | `/api/mobile/admin/maintenance/requests` | Demandes maintenance |
| `GET` | `/api/mobile/admin/maintenance/visits` | Visites planifiées |
| `PATCH` | `/api/mobile/admin/maintenance/contracts/{id}/activate` | Activer un contrat |
| `PATCH` | `/api/mobile/admin/maintenance/requests/{id}/status` | Changer statut demande |
| `PATCH` | `/api/mobile/admin/maintenance/visits/{id}/validate` | Valider une visite |

---

## 🔧 SAV (Service Après-Vente)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/sav` | Liste des tickets (filtres: `status`, `priority`) |
| `GET` | `/api/mobile/admin/sav/{id}` | Détail d'un ticket |
| `PATCH` | `/api/mobile/admin/sav/{id}/status` | Changer le statut |
| `PATCH` | `/api/mobile/admin/sav/{id}/assign` | Assigner un technicien |
| `PATCH` | `/api/mobile/admin/sav/{id}/resolve` | Résoudre le ticket |
| `GET` | `/api/mobile/admin/sav/stats` | Statistiques SAV |

**Statuts SAV** : `open` | `in_progress` | `resolved` | `closed` | `critical`

**Priorités** : `urgent` | `high` | `normal` | `low`

---

## 💬 Messages Clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/messages` | Liste des messages (filtres: `status`) |
| `GET` | `/api/mobile/admin/messages/{id}` | Détail d'un message |
| `POST` | `/api/mobile/admin/messages/{id}/respond` | Répondre au message |
| `PATCH` | `/api/mobile/admin/messages/{id}/status` | Marquer lu/répondu |
| `GET` | `/api/mobile/admin/messages/stats` | Stats messages |

**Statuts Messages** : `unread` | `read` | `responded`

**Corps POST réponse** :
```json
{ "response": "Bonjour, votre commande est en cours de traitement." }
```

---

## 👥 Clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/clients` | Liste des clients |
| `GET` | `/api/mobile/admin/clients/{id}` | Détail d'un client |
| `GET` | `/api/mobile/admin/clients/{id}/orders` | Commandes d'un client |
| `GET` | `/api/mobile/admin/clients/{id}/rdv` | RDV d'un client |

---

## 🔔 Notifications

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/notifications` | Liste des notifications |
| `GET` | `/api/mobile/admin/notifications/{id}` | Détail |
| `POST` | `/api/mobile/admin/notifications/{id}/send` | Envoyer une notification push |
| `PATCH` | `/api/mobile/admin/notifications/{id}/status` | Changer statut |
| `GET` | `/api/mobile/admin/notifications/stats` | Stats notifications |

---

## 🖼️ Produits

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/products` | Liste publique des produits |
| `GET` | `/api/mobile/admin/products` | Liste admin (avec stock) |
| `GET` | `/api/mobile/admin/products/{id}` | Détail admin |
| `POST` | `/api/mobile/admin/products` | Créer un produit |
| `PATCH` | `/api/mobile/admin/products/{id}` | Modifier un produit |
| `DELETE` | `/api/mobile/admin/products/{id}` | Supprimer un produit |

---

## 🎨 Bannières

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/banners` | Liste des bannières actives |
| `GET` | `/api/mobile/admin/banners` | Liste admin (toutes) |
| `POST` | `/api/mobile/admin/banners` | Créer une bannière |
| `PATCH` | `/api/mobile/admin/banners/{id}` | Modifier une bannière |
| `PATCH` | `/api/mobile/admin/banners/{id}/toggle` | Activer/Désactiver |
| `DELETE` | `/api/mobile/admin/banners/{id}` | Supprimer |

---

## 🏆 Réalisations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/realisations` | Liste des réalisations |
| `GET` | `/api/mobile/admin/realisations/{id}` | Détail |
| `POST` | `/api/mobile/admin/realisations` | Créer |
| `PATCH` | `/api/mobile/admin/realisations/{id}` | Modifier |
| `PATCH` | `/api/mobile/admin/realisations/{id}/featured` | Mettre en vedette |
| `DELETE` | `/api/mobile/admin/realisations/{id}` | Supprimer |

---

## 📋 Audit

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/audit` | Journal d'audit (filtres: `action`, `user`, `from`, `to`) |

---

## ⚙️ Paramètres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/admin/settings` | Paramètres globaux |
| `PATCH` | `/api/mobile/admin/settings` | Modifier les paramètres |

---

## 📍 Utilitaires

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/mobile/quartiers` | Liste des quartiers d'Abidjan |
| `GET` | `/api/mobile/brands` | Liste des marques |
| `GET` | `/api/mobile/activity` | Activité récente |

---

## ⚠️ Codes d'Erreur Standards

| Code | Signification |
|------|---------------|
| `401` | Non authentifié — token manquant ou expiré |
| `403` | Accès refusé — rôle insuffisant |
| `404` | Ressource introuvable |
| `422` | Données invalides — voir `errors` dans la réponse |
| `429` | Trop de requêtes — rate limit atteint |
| `500` | Erreur serveur interne |

**Format erreur standard** :
```json
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "La commande #123 n'existe pas.",
  "details": {}
}
```

---

## 🔄 Pagination

Les endpoints de liste supportent les paramètres :

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `limit` | int | 20 | Nombre d'items par page |
| `offset` | int | 0 | Décalage (pour pagination) |
| `search` | string | — | Recherche texte libre |
| `status` | string | — | Filtre par statut |

---

*Généré automatiquement — MaasGa Admin v1.0.0*
