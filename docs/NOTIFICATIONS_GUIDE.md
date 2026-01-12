# 📢 Guide Unifié des Notifications

Ce document décrit le système de notifications unifié de l'application OpenRift.

## 🎨 Couleurs Standardisées

Toutes les couleurs sont définies dans `frontend/src/constants/colors.ts`:

```typescript
export const COLORS = {
  success: '#3D7A5F',    // Vert
  error: '#C75B5B',      // Rouge
  warning: '#D4A855',    // Jaune/Or
  info: '#5B8AC7',       // Bleu
}
```

## 📋 Types de Notifications

### 1. **Toast Notifications** (Messages temporaires)

**Quand utiliser**: Actions utilisateur avec feedback immédiat (succès/erreur)

**Composant**: `Toast.tsx`
**Contexte**: `ToastContext.tsx`
**Hook**: `useToast()`

**Exemples d'utilisation**:
```typescript
import { useToast } from '../contexts/ToastContext';

const toast = useToast();

// Succès
toast?.success('Riot account verified successfully!');

// Erreur
toast?.error('Failed to update profile');

// Avertissement
toast?.warning('You have unsaved changes');

// Info
toast?.info('Syncing data from Riot...');
```

**Caractéristiques**:
- Position: Coin supérieur droit
- Durée: 4 secondes (par défaut)
- Auto-dismiss
- Bouton de fermeture manuel
- Animation: slide-in-right

---

### 2. **Inline Messages** (Messages contextuels)

**Quand utiliser**: Messages persistants dans le flux de la page

**Composant**: `InlineMessage.tsx` ✨ NOUVEAU

**Exemples d'utilisation**:
```typescript
import { InlineMessage } from '../components/ui/InlineMessage';

// Succès
<InlineMessage type="success" message="File uploaded successfully" />

// Erreur
<InlineMessage type="error" message="Failed to load data" />

// Avertissement
<InlineMessage type="warning" message="This action cannot be undone" />

// Info
<InlineMessage type="info" message="Processing your request..." />
```

**Caractéristiques**:
- Affiché inline dans la page
- Persistant (ne disparaît pas automatiquement)
- Icône + Message
- Fond semi-transparent avec bordure colorée

---

### 3. **Confirm Dialogs** (Confirmations modales)

**Quand utiliser**: Actions destructives nécessitant confirmation

**Composant**: `ConfirmDialog.tsx`

**Exemples d'utilisation**:
```typescript
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  title="Delete Team?"
  message="This action cannot be undone."
  type="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  confirmText="Delete"
  cancelText="Cancel"
/>
```

**Types disponibles**:
- `danger`: Actions destructives (rouge)
- `warning`: Actions à risque (jaune)
- `info`: Informations importantes (bleu)

---

## 🔄 Migration des Anciennes Notifications

### ❌ À ÉVITER

```typescript
// NE PAS UTILISER window.confirm()
if (window.confirm('Are you sure?')) {
  // ...
}

// NE PAS UTILISER window.alert()
alert('Success!');

// NE PAS créer des divs custom pour chaque message
<div className="text-red-400">❌ Error: {error}</div>
```

### ✅ UTILISER À LA PLACE

```typescript
// TOAST pour feedback rapide
toast?.success('Action completed!');
toast?.error('Action failed');

// INLINE MESSAGE pour messages persistants
<InlineMessage type="error" message={error} />

// CONFIRM DIALOG pour confirmations
<ConfirmDialog
  isOpen={showConfirm}
  type="danger"
  onConfirm={handleAction}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## 📊 Tableau de Correspondance

| Ancien Code | Nouveau Code | Type |
|-------------|--------------|------|
| `window.confirm()` | `<ConfirmDialog />` | Modal |
| `window.alert()` | `toast?.info()` | Toast |
| `<div className="text-red-400">Error</div>` | `<InlineMessage type="error" />` | Inline |
| `<div className="text-green-400">Success</div>` | `<InlineMessage type="success" />` | Inline |
| Custom error div | `toast?.error()` ou `<InlineMessage />` | Variable |

---

## 🎯 Cas d'Usage Recommandés

### Actions Formulaire
```typescript
try {
  await updateProfile(data);
  toast?.success('Profile updated successfully');
} catch (error) {
  toast?.error('Failed to update profile');
}
```

### Vérification Riot
```typescript
try {
  await verifyRiotAccount(gameName, tagLine);
  toast?.success('Riot account verified!');
} catch (error) {
  toast?.error(error.message);
}
```

### Upload de Fichier
```typescript
// Pendant le chargement
<InlineMessage type="info" message="Uploading..." />

// En cas de succès
toast?.success('File uploaded successfully');

// En cas d'erreur
<InlineMessage type="error" message={uploadError} />
```

### Suppression (Action Destructive)
```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Bouton de suppression
<button onClick={() => setShowDeleteConfirm(true)}>Delete</button>

// Dialog de confirmation
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="Delete User?"
  message="This will permanently delete the user. This action cannot be undone."
  type="danger"
  confirmText="Delete User"
  cancelText="Cancel"
  onConfirm={async () => {
    try {
      await deleteUser(userId);
      toast?.success('User deleted successfully');
    } catch (error) {
      toast?.error('Failed to delete user');
    }
    setShowDeleteConfirm(false);
  }}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

## 🔧 Fichiers à Mettre à Jour

### ✅ Déjà Uniformisés
- `Toast.tsx` - Utilise les couleurs standardisées
- `InlineMessage.tsx` - Nouveau composant créé
- `colors.ts` - Constantes de couleurs définies

### 🔄 À Mettre à Jour
- [ ] `AdminPage.tsx` - Remplacer `window.confirm()` par `<ConfirmDialog />`
- [ ] `ProfilePage.tsx` - Remplacer `window.confirm()` par `<ConfirmDialog />`
- [ ] `DataAnalyticsPage.tsx` - Remplacer les messages inline custom par `<InlineMessage />`
- [ ] `ConfirmDialog.tsx` - Importer et utiliser `COLORS` depuis `colors.ts`

---

## 📝 Checklist de Validation

Avant de merger du code, vérifier:

- [ ] Aucun `window.confirm()` ou `window.alert()`
- [ ] Aucune div custom pour les messages (utiliser `InlineMessage`)
- [ ] Les toasts utilisent `useToast()` hook
- [ ] Les confirmations utilisent `<ConfirmDialog />`
- [ ] Les couleurs viennent de `COLORS` constant
- [ ] Les messages sont clairs et en anglais
- [ ] Les icônes correspondent au type de message

---

## 🎨 Design System

### Spacing
- Toast padding: `px-6 py-4`
- Inline message padding: `px-4 py-3`
- Gap entre icône et texte: `gap-3`

### Typography
- Toast: `text-sm font-medium`
- Inline: `text-sm font-medium`
- Dialog title: `text-xl font-semibold`

### Animations
- Toast: `animate-slide-in-right` (4s auto-dismiss)
- Dialog: `animate-scale-in` (backdrop fade-in)

### Z-Index
- Toast container: `z-[9999]`
- Dialog overlay: `z-9999`

---

## 🚀 Prochaines Étapes

1. ✅ Créer `colors.ts` avec couleurs standardisées
2. ✅ Mettre à jour `Toast.tsx` pour utiliser les couleurs
3. ✅ Créer `InlineMessage.tsx` composant
4. 🔄 Migrer `AdminPage.tsx` vers `ConfirmDialog`
5. 🔄 Migrer `ProfilePage.tsx` vers `ConfirmDialog`
6. 🔄 Mettre à jour `ConfirmDialog.tsx` pour utiliser `COLORS`
7. 🔄 Remplacer tous les messages inline custom par `InlineMessage`

---

*Dernière mise à jour: 2026-01-11*
