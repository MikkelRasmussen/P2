const registerRecommendRoutes = require('./recommend.routes');
const registerPricesRoutes = require('./prices.routes');

function registerRoutes(app) {
    registerRecommendRoutes(app);
    registerPricesRoutes(app);
}

module.exports = registerRoutes;
