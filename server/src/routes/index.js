const registerRecommendRoutes = require('./recommendRoutes');
const registerPricesRoutes = require('./pricesRoutes');

function registerRoutes(app) {
    registerRecommendRoutes(app);
    registerPricesRoutes(app);
}

module.exports = registerRoutes;
