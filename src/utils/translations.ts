export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  [key: string]: {
    en: string;
    es: string;
    fr: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation & Branding
  brandName: {
    en: 'FerryFlow',
    es: 'FerryFlow',
    fr: 'FerryFlow',
  },
  tagline: {
    en: 'Real-Time Maritime Operations & Passenger Portals',
    es: 'Operaciones Marítimas en Tiempo Real y Portales de Pasajeros',
    fr: 'Opérations Maritimes en Temps Réel & Portails Passagers',
  },
  navHome: {
    en: 'Live Map & Routes',
    es: 'Mapa y Rutas',
    fr: 'Carte & Traversées',
  },
  navLiveTracking: {
    en: 'Fleet Radar',
    es: 'Radar de Flota',
    fr: 'Radar de Flotte',
  },
  navRoutes: {
    en: 'Routes & Timetables',
    es: 'Rutas y Horarios',
    fr: 'Lignes & Horaires',
  },
  navPorts: {
    en: 'Terminals & Piers',
    es: 'Terminales y Muelles',
    fr: 'Terminaux & Quais',
  },
  navBook: {
    en: 'Book Passage',
    es: 'Reservar Billete',
    fr: 'Réserver Traversée',
  },
  navTickets: {
    en: 'My Passes & Rewards',
    es: 'Mis Billetes y Puntos',
    fr: 'Mes Billets & Fidélité',
  },
  navAlerts: {
    en: 'Marine Advisories',
    es: 'Avisos Marítimos',
    fr: 'Bulletins Maritimes',
  },
  navOperator: {
    en: 'Port Operations',
    es: 'Operaciones Portuarias',
    fr: 'Opérations Portuaires',
  },
  navCaptain: {
    en: "Captain's Bridge",
    es: 'Puente de Mando',
    fr: 'Passerelle Commandant',
  },
  navAdmin: {
    en: 'Fleet Command',
    es: 'Control de Flota',
    fr: 'Commandement Flotte',
  },

  // Common UI Actions
  search: {
    en: 'Search',
    es: 'Buscar',
    fr: 'Rechercher',
  },
  filter: {
    en: 'Filter',
    es: 'Filtrar',
    fr: 'Filtrer',
  },
  bookNow: {
    en: 'Book Now',
    es: 'Reservar Ahora',
    fr: 'Réserver',
  },
  cancel: {
    en: 'Cancel',
    es: 'Cancelar',
    fr: 'Annuler',
  },
  exportPdf: {
    en: 'Export PDF Ticket',
    es: 'Exportar Billete en PDF',
    fr: 'Exporter Billet PDF',
  },
  printPass: {
    en: 'Print Pass',
    es: 'Imprimir Pase',
    fr: 'Imprimer le Pass',
  },
  scanGateQr: {
    en: 'Scan Gate QR',
    es: 'Escanear QR de Puerta',
    fr: 'Scanner QR Embarquement',
  },
  frequentVoyager: {
    en: 'Frequent Voyager Rewards',
    es: 'Recompensas Viajero Frecuente',
    fr: 'Programme Grand Voyageur',
  },
  voyagerPoints: {
    en: 'Voyager Points',
    es: 'Puntos de Viajero',
    fr: 'Points Voyageur',
  },
  tierProgress: {
    en: 'Tier Progress',
    es: 'Progreso de Nivel',
    fr: 'Progression de Statut',
  },

  // Ferry Statuses
  onTime: {
    en: 'On Time',
    es: 'A Tiempo',
    fr: 'À l’Heure',
  },
  delayed: {
    en: 'Delayed',
    es: 'Retrasado',
    fr: 'Retardé',
  },
  boarding: {
    en: 'Boarding',
    es: 'Embarcando',
    fr: 'Embarquement',
  },
  approaching: {
    en: 'Approaching Port',
    es: 'Aproximando Puerto',
    fr: 'Approche Quai',
  },
  docked: {
    en: 'Docked at Berth',
    es: 'Atracado',
    fr: 'À Quai',
  },
  underway: {
    en: 'Underway',
    es: 'En Tránsito',
    fr: 'En Route',
  },

  // Portal & Admin
  vesselComparison: {
    en: 'Vessel Performance Comparison',
    es: 'Comparador de Rendimiento de Buques',
    fr: 'Comparateur de Performance Navires',
  },
  fuelUsage: {
    en: 'Fuel Consumption',
    es: 'Consumo de Combustible',
    fr: 'Consommation Carburant',
  },
  uptime: {
    en: 'Operational Uptime',
    es: 'Disponibilidad Operativa',
    fr: 'Disponibilité Opérationnelle',
  },
  maintenanceHistory: {
    en: 'Maintenance History',
    es: 'Historial de Mantenimiento',
    fr: 'Historique de Maintenance',
  },
  offlinePersistence: {
    en: 'Offline Local State Storage',
    es: 'Almacenamiento Local Fuera de Línea',
    fr: 'Stockage Local Hors-Ligne',
  },
};

export const getTranslation = (key: string, lang: Language): string => {
  if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
    return TRANSLATIONS[key][lang];
  }
  // Return english fallback or key
  return TRANSLATIONS[key]?.en || key;
};
