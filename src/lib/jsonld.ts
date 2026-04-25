// Powered by skill: seo-local
import { BRAND } from '../data/brand';
import { MENU, ALL_CATEGORIES, CATEGORY_LABEL, itemsByCategory } from '../data/menu';
import { DRINKS } from '../data/drinks';

export function buildRestaurantJsonLd(canonicalUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': canonicalUrl + '#restaurant',
    name: BRAND.marketingName,
    alternateName: BRAND.legalName,
    image: canonicalUrl + '/brand/og-image.jpg',
    url: canonicalUrl,
    telephone: BRAND.contact.phoneE164,
    email: BRAND.contact.email,
    priceRange: '€',
    servesCuisine: ['Türkisch', 'Mediterran', 'Pizza'],
    acceptsReservations: false,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.address.street,
      postalCode: BRAND.address.postalCode,
      addressLocality: BRAND.address.city,
      addressRegion: BRAND.address.region,
      addressCountry: BRAND.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BRAND.geo.latitude,
      longitude: BRAND.geo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: BRAND.openingHours.weekday.open,
        closes: BRAND.openingHours.weekday.close,
      },
    ],
    sameAs: [BRAND.social.instagramUrl].filter(Boolean),
    hasMenu: { '@id': canonicalUrl + '#menu' },
  };
}

export function buildMenuJsonLd(canonicalUrl: string): Record<string, unknown> {
  const sections = ALL_CATEGORIES.map((cat) => ({
    '@type': 'MenuSection',
    name: CATEGORY_LABEL[cat],
    hasMenuItem: itemsByCategory(cat).map((item) => ({
      '@type': 'MenuItem',
      name: item.name,
      description: item.description,
      offers:
        item.priceEur === null
          ? undefined
          : {
              '@type': 'Offer',
              price: item.priceEur.toFixed(2),
              priceCurrency: 'EUR',
            },
    })),
  }));
  // Add a drinks section
  sections.push({
    '@type': 'MenuSection',
    name: 'Getränke',
    hasMenuItem: DRINKS.flatMap((d) =>
      d.variants.map((v) => ({
        '@type': 'MenuItem',
        name: `${d.name} (${v.label})`,
        description: undefined as string | undefined,
        offers: {
          '@type': 'Offer',
          price: v.priceEur.toFixed(2),
          priceCurrency: 'EUR',
        },
      })),
    ),
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': canonicalUrl + '#menu',
    name: 'Speisekarte Pimp My Kebap',
    hasMenuSection: sections,
  };
}

export function buildBreadcrumbJsonLd(canonicalUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: canonicalUrl },
    ],
  };
}

void MENU;
