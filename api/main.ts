export const config = {
    api: {
        bodyParser: false,
    },
};

export default async (req: any, res: any) => {
    try {
        // Polyfill for libraries that expect DOMMatrix (like pdfjs-dist used in pdf-to-img)
        if (typeof (global as any).DOMMatrix === 'undefined') {
            (global as any).DOMMatrix = class DOMMatrix {
                constructor() { }
            };
        }

        console.log(`[Vercel] Invoking Master API: ${req.method} ${req.url}`);
        const { default: app } = await import('../server/src/app');
        return app(req, res);
    } catch (err: any) {
        console.error('[Vercel Entry Crash]', err);
        res.status(500).json({
            error: 'API Master Handler Crash',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
