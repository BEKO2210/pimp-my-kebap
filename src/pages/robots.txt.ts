// Powered by skill: seo-local
export const prerender = true;

export function GET() {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? 'https://beko2210.github.io/pimp-my-kebap').replace(/\/$/, '');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
