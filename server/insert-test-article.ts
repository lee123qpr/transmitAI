import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const content = `# The Power of AI in Construction
This is a test article demonstrating the new **Rich Text System** powered by Markdown.

## Why Markdown?
Using markdown ensures your text looks perfect on every device without messy inline styles. Let's look at what you can do:

### Formatting Options
- **Bold Text** for emphasis
- *Italic Text* for nuance
- \`<span className="text-blue-500">\` Inline code snippets \`</span>\`

> "Document control is no longer a manual process. It's an automated data stream." - Transmit.AI

### Code Blocks
If you ever need to share technical specs or instructions, code blocks are fully supported:
\`\`\`javascript
const automate = new TransmitAI();
automate.process('drawings.pdf');
\`\`\`

### Next Steps
1. Navigate to the Admin Dashboard.
2. Edit an article.
3. Use the toolbar or type markdown directly!

*Ready to stop spending hours on transmittals?* Try Transmit.AI free today.
`;

const insert = async () => {
    try {
        await pool.query(
            `INSERT INTO articles (title, slug, content, published, keywords) 
            VALUES ($1, $2, $3, $4, $5)`,
            [
                'Markdown in Action: The New Article Editor',
                'markdown-in-action-' + Date.now().toString(),
                content,
                true,
                'News, Product Update'
            ]
        );
        console.log('Test article inserted!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
insert();
