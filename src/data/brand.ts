// Powered by skill: seo-local, security
// Single source of truth for business data, addresses, opening hours, slogans.
// IMPORTANT: Do NOT add the owner's home address here, in any file, or in any
// commit. The preflight script enforces this.

export const BRAND = {
  marketingName: 'Pimp My Kebap',
  // Gewerblich angemeldeter Name laut Gewerbeschein (GewA 1, Feld 3
  // "Name des Geschäfts") — § 5 DDG-pflichtig im Impressum. "Pimp My
  // Kebap" ist nur die Geschäftsbezeichnung/Marke.
  legalName: 'Zentrum Pizza und Kebaphaus',
  legalForm: 'Einzelunternehmen',

  // Inhaberin laut Gewerbeschein (Feld 1+4+5).
  ownerName: 'Fatma Tasocak-Savci',
  ownerLabel: 'Inhaberin',
  // Im Gewerbeschein (Feld 14) ist KEINE vertretungsberechtigte Person
  // eingetragen — bei Einzelunternehmen i.d.R. nicht moeglich, der Inhaber
  // vertritt selbst. Ali ist faktisch Betriebsleiter im Tagesgeschäft;
  // das ist eine freiwillige Zusatzinformation, kein rechtlicher Titel.
  // "Geschäftsführer" waere falsch (GmbHG-Begriff).
  managerName: 'Ali Murat Tasocak',
  managerLabel: 'Betriebsleiter',

  address: {
    street: 'Marktplatz 18',
    postalCode: '71691',
    city: 'Freiberg am Neckar',
    region: 'Baden-Württemberg',
    country: 'DE',
    countryFull: 'Deutschland',
  },

  contact: {
    phoneE164: '+491742116095',
    phoneDisplay: '0174 2116095',
    whatsappE164NoPlus: '491742116095', // for https://wa.me/...
    whatsappDisplay: '+49 174 2116095',
    email: 'Zentrumdoener@outlook.com',
  },

  geo: {
    // Marktplatz 18, 71691 Freiberg am Neckar (Ortsteil Beihingen) —
    // OSM-Adress-Datenbank-Wert fuer "18, Marktplatz" (Building-Centroid).
    // Liegt ~14 m noerdoestlich der Pimp-my-Kebap-Google-Listing-Position
    // — Letztere markiert die Eingangs-Tuer, Erstere die Adresse selbst.
    // Wir nehmen die Adresse, weil das Schema.org-JSON-LD und die OSM-Karte
    // die Adress-Position erwarten.
    latitude: 48.9355094,
    longitude: 9.1927770,
  },

  openingHours: {
    weekday: { open: '10:30', close: '21:00' },
    sunday: null,
    holiday: { open: '12:00', close: '21:00' },
  },

  slogans: {
    primary: 'Create Your Kebap. Pay Your Style.',
    secondary: 'Mehr Genuss. Mehr Ideen. Mehr Extra.',
    tagline: 'Frisch · Fair · Flexibel',
    short: 'Dein Geschmack. Dein Kebap.',
  },

  social: {
    instagramHandle: 'pimp_my_kebap_zentrum',
    instagramUrl: 'https://www.instagram.com/pimp_my_kebap_zentrum/',
    facebook: null as string | null,
    googleBusinessProfile: null as string | null,
  },

  delivery: {
    minOrderEur: 20.0,
    note: 'Andere Städte nach Absprache. Kostenlose Lieferung für Firmen.',
  },
} as const;

export type BrandData = typeof BRAND;

/** Returns the WhatsApp number to use, falling back to the brand default. */
export function resolveWhatsAppNumber(envValue?: string): string {
  const fromEnv = envValue?.trim();
  if (fromEnv && /^\d{8,15}$/.test(fromEnv)) return fromEnv;
  return BRAND.contact.whatsappE164NoPlus;
}
