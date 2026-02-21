export default (req: any, res: any) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        message: 'Standalone function is live'
    });
};
