const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load env manually if not present
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DOMAIN = 'https://www.transmittal.co.uk';
const SITEMAP_PATH = path.join(__dirname, '../../../client/public/sitemap.xml');

// Static routes that don't change
const staticRoutes = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/how-it-works', changefreq: 'monthly', priority: 0.8 },
    { url: '/articles', changefreq: 'daily', priority: 0.9 }, // High priority as articles are added
    { url: '/contact', changefreq: 'monthly', priority: 0.5 },
    // Legal
    { url: '/agreements/cookie', changefreq: 'yearly', priority: 0.1 },
    { url: '/agreements/privacy', changefreq: 'yearly', priority: 0.1 },
    { url: '/agreements/terms-of-service', changefreq: 'yearly', priority: 0.1 },
    { url: '/agreements/acceptable-use', changefreq: 'yearly', priority: 0.1 }
];

async function generateSitemap() {
    console.log('Generating dynamic sitemap...');

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set. Cannot pull dynamic routes (Articles). Generating static-only sitemap.');
        writeSitemap(staticRoutes, []);
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Fetch published articles from DB
        const res = await pool.query(`
      SELECT slug, created_at, updated_at 
      FROM articles 
      WHERE published = true 
      ORDER BY created_at DESC
    `);

        // 2. Format as sitemap entries
        const dynamicRoutes = res.rows.map((row: any) => ({
            url: `/articles/${row.slug}`,
            // Use updated_at if available, fallback to created_at
            lastmod: new Date(row.updated_at || row.created_at).toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.7 // Articles get an above-average priority
        }));

        console.log(`Found ${dynamicRoutes.length} published articles for the sitemap.`);

        // 3. Write XML
        writeSitemap(staticRoutes, dynamicRoutes);

    } catch (err) {
        console.error('Error querying database for sitemap:', err);
        console.log('Generating static-only sitemap as fallback.');
        writeSitemap(staticRoutes, []);
    } finally {
        await pool.end();
    }
}

function writeSitemap(staticList: any[], dynamicList: any[]) {
    const allRoutes = [...staticList, ...dynamicList];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    allRoutes.forEach(route => {
        xml += `  <url>\n`;
        xml += `    <loc>${DOMAIN}${route.url}</loc>\n`;
        if (route.lastmod) {
            xml += `    <lastmod>${route.lastmod}</lastmod>\n`;
        }
        xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
        xml += `    <priority>${route.priority.toFixed(1)}</priority>\n`;
        xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    try {
        fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
        console.log(`Successfully generated sitemap.xml at ${SITEMAP_PATH}`);
    } catch (err) {
        console.error('Failed to write sitemap.xml:', err);
        // Explicit process exit with error code so the build fails gracefully but noticeably
        process.exitCode = 1;
    }
}

generateSitemap();
