// Powered by skill: seo-local
export const prerender = true;

export function GET() {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? 'https://beko2210.github.io/pimp-my-kebap').replace(/\/$/, '');
  const urls = [
    { loc: `${siteUrl}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${siteUrl}/impressum`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${siteUrl}/datenschutz`, changefreq: 'yearly', priority: '0.3' },
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
