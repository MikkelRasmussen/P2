const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const registerRoutes = require('./routes');
const { clearCategoryCache } = require('./services/recommendationService');
const { clearValuatedCache } = require('./services/pricingService');

clearValuatedCache();
clearCategoryCache();

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
}));

app.use(express.json());

registerRoutes(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
