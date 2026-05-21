const {
    recommendWithMetadata,
} = require('../services/recommendation.service');

const DEFAULT_BUDGET_MIN = 45;
const DEFAULT_BUDGET_MAX = 9999;

function registerRecommendRoutes(app) {
    app.get('/recommend', async (req, res) => {
        try {
            const amount = Number(req.query.amount ?? 6);
            const budgetMin = Number(req.query.budgetMin ?? DEFAULT_BUDGET_MIN);
            const budgetMax = Number(req.query.budgetMax ?? DEFAULT_BUDGET_MAX);
            const excludes = req.query.excludes ? JSON.parse(req.query.excludes) : [];
            const memoryScores = req.query.memoryScores ? JSON.parse(req.query.memoryScores) : {};

            const results = await recommendWithMetadata({
                excludes,
                amount,
                budgetMin,
                budgetMax,
                memoryScores,
            });

            res.json(results);
        } catch (error) {
            console.error("RECOMMEND ERROR:", error);
            res.status(500).json({ error: 'Failed to recommend recipes' });
        }
    });
}

module.exports = registerRecommendRoutes;
