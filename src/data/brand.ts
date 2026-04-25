// Powered by skill: seo-local, security
// Single source of truth for business data, addresses, opening hours, slogans.
// IMPORTANT: Do NOT add the owner's home address here, in any file, or in any
// commit. The preflight script enforces this.

export const BRAND = {
  marketingName: 'Pimp My Kebap',
  legalName: 'Zentrum Pizza und Kebaphaus',
  legalForm: 'Einzelunternehmen',

  ownerName: 'Fatma Tasocak-Savci',
  ownerLabel: 'Inhaberin',
  managerName: 'Ali Murat Tasocak',
  managerLabel: 'Geschäftsführer',

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
    // Marktplatz 18, 71691 Freiberg am Neckar (approx.; verify on first deploy)
    latitude: 48.9333,
    longitude: 9.215,
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
    instagramHandle: 'zentrumdoner',
    instagramUrl: 'https://www.instagram.com/zentrumdoner/',
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
