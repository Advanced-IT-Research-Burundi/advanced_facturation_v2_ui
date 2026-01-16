// Constants pour les mouvements de stock

export const MOUVEMENT_TYPES = {
  'EN': 'Entrée Normale',
  'ER': 'Entrée Retour',
  'EI': 'Entrée Inventaire',
  'EAJ': 'Entrée Ajustement',
  'ET': 'Entrée Transfert',
  'EAU': 'Entrée Autres',
  'SN': 'Sortie Normale',
  'SP': 'Sortie Perte',
  'SV': 'Sortie Vol',
  'SD': 'Sortie Désuétude',
  'SC': 'Sortie Casse',
  'SAJ': 'Sortie Ajustement',
  'ST': 'Sortie Transfert',
  'SAU': 'Sortie Autres'
};

export const ENTRY_TYPES = [
  { value: 'EN', label: 'EN - Entrée Normale' },
  { value: 'ER', label: 'ER - Entrée Retour' },
  { value: 'EI', label: 'EI - Entrée Inventaire' },
  { value: 'EAJ', label: 'EAJ - Entrée Ajustement' },
  { value: 'ET', label: 'ET - Entrée Transfert' },
  { value: 'EAU', label: 'EAU - Entrée Autres' }
];

export const EXIT_TYPES = [
  { value: 'SN', label: 'SN - Sortie Normale' },
  { value: 'SP', label: 'SP - Sortie Perte' },
  { value: 'SV', label: 'SV - Sortie Vol' },
  { value: 'SD', label: 'SD - Sortie Désuétude' },
  { value: 'SC', label: 'SC - Sortie Casse' },
  { value: 'SAJ', label: 'SAJ - Sortie Ajustement' },
  { value: 'ST', label: 'ST - Sortie Transfert' },
  { value: 'SAU', label: 'SAU - Sortie Autres' }
];

export const CURRENCIES = [
  { value: 'BIF', label: 'BIF - Franc Burundais' },
  { value: 'USD', label: 'USD - Dollar Américain' },
  { value: 'EUR', label: 'EUR - Euro' }
];

export const OBR_STATUS_CLASSES = {
  'PENDING': 'bg-warning',
  'SENT': 'bg-info',
  'ACCEPTED': 'bg-success',
  'REJECTED': 'bg-danger'
};
