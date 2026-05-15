// server/index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuration for external API calls
const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'https://api.sallinggroup.com',
  apiKey: process.env.API_KEY || 'SG_APIM_4A20F12K69B8YC47D1E094QEZPMW7Q73B1BZCN2PW2QF88VQ3C4G',
  timeout: 10000,
  maxRetries: 3
};

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'] || req.query.api_key;

  if (!providedKey) {
    return res.status(401).json({
      error: 'API key is required. Please provide it in the header (x-api-key) or query parameter (api_key)'
    });
  }

  if (providedKey !== API_CONFIG.apiKey) {
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }

  next();
};

// Helper function to make API calls with retry logic
const makeApiCall = async (endpoint, retries = 0) => {
  try {
    const response = await axios.get(`https://${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: API_CONFIG.timeout
    });

    return response.data;
  } catch (error) {
    if (retries < API_CONFIG.maxRetries) {
      console.log(`Retrying API call to ${endpoint} (${retries + 1}/${API_CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
      return makeApiCall(endpoint, retries + 1);
    }

    throw new Error(`Failed to fetch data from ${endpoint}: ${error.message}`);
  }
};

// Route to fetch data from multiple endpoints with a single key
app.post('/api/fetch-multiple', validateApiKey, async (req, res) => {
  try {
    const { endpoints, basePath } = req.body;

    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      return res.status(400).json({
        error: 'Please provide a non-empty array of endpoints in the request body'
      });
    }

    // Validate endpoints format
    const validEndpoints = endpoints.filter(endpoint =>
      typeof endpoint === 'string' && endpoint.trim().length > 0
    );

    if (validEndpoints.length === 0) {
      return res.status(400).json({
        error: 'All endpoints must be non-empty strings'
      });
    }

    // Build full URLs using basePath if provided
    const fullEndpoints = validEndpoints.map(endpoint => {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = basePath ? `${basePath}${cleanEndpoint}` : cleanEndpoint;
      return fullUrl;
    });

    console.log(`Fetching data from ${fullEndpoints.length} endpoints:`, fullEndpoints);

    // Make concurrent API calls
    const promises = fullEndpoints.map(endpoint => makeApiCall(endpoint));
    const results = await Promise.allSettled(promises);

    // Process results
    const successfulResults = [];
    const failedResults = [];

    results.forEach((result, index) => {
      const endpoint = fullEndpoints[index];
      if (result.status === 'fulfilled') {
        successfulResults.push({
          endpoint,
          data: result.value,
          status: 'success'
        });
      } else {
        failedResults.push({
          endpoint,
          error: result.reason.message,
          status: 'failed'
        });
      }
    });

    const response = {
      success: successfulResults.length,
      failed: failedResults.length,
      total: fullEndpoints.length,
      results: successfulResults,
      errors: failedResults
    };

    // Log summary
    console.log(`API calls completed: ${successfulResults.length}/${fullEndpoints.length} successful`);

    res.json(response);

  } catch (error) {
    console.error('Error in fetch-multiple endpoint:', error);
    res.status(500).json({
      error: 'Internal server error while fetching data',
      details: error.message
    });
  }
});

// Route to fetch data from a single endpoint (for testing)
app.get('/api/fetch-single', validateApiKey, async (req, res) => {
  try {
    const { endpoint, basePath } = req.query;

    if (!endpoint) {
      return res.status(400).json({
        error: 'Please provide an endpoint parameter'
      });
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = basePath ? `${basePath}${cleanEndpoint}` : cleanEndpoint;

    console.log(`Fetching data from single endpoint: ${fullUrl}`);

    const data = await makeApiCall(fullUrl);

    res.json({
      endpoint: fullUrl,
      data,
      status: 'success'
    });

  } catch (error) {
    console.error('Error in fetch-single endpoint:', error);
    res.status(500).json({
      error: 'Internal server error while fetching data',
      details: error.message
    });
  }
});

// Route to test the API configuration
app.get('/api/test-config', validateApiKey, (req, res) => {
  res.json({
    message: 'API configuration is valid',
    config: {
      baseUrl: API_CONFIG.baseUrl,
      hasApiKey: !!API_CONFIG.apiKey,
      timeout: API_CONFIG.timeout,
      maxRetries: API_CONFIG.maxRetries
    }
  });
});

// Simple route for testing
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Express!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Something went wrong!',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`  GET  /api/hello - Simple test endpoint`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  GET  /api/test-config - Test API configuration (requires API key)`);
  console.log(`  GET  /api/fetch-single - Fetch from single endpoint (requires API key)`);
  console.log(`  POST /api/fetch-multiple - Fetch from multiple endpoints (requires API key)`);
  console.log(`\nAPI Key: ${API_CONFIG.apiKey}`);
  console.log(`Base URL: ${API_CONFIG.baseUrl}`);
});

const sql = require('./SQLHandler/SQLHandler.js');
const sqlHandler = new sql();

const sqlTask = () => new Promise(async (res, rej) => {
  console.log(process.cwd());
  if (!await sqlHandler.Connect("localhost", "postgres", "Post2025", 5432, 'FoodDB', false).catch(e => false)) return;

  //Import and embed recipes and determine ingredients
  const couldImport = await sqlHandler.ImportRecipes();
  if (!couldImport) {
    rej("Could not import recipes!");
    return;
  }

  //Import and embed store products
  const updateConfirms = [];
  updateConfirms['bilka'] = await sqlHandler.ImportSallingData("bilkatogo");
  updateConfirms['føtex'] = await sqlHandler.ImportSallingData("foetexplus");
  updateConfirms['netto'] = await sqlHandler.ImportSallingData("nettoplus");
  Object.entries(updateConfirms).forEach(e => {
    if (!e[1]) console.warn(`failed to Import from ${e[0]}`);
  })

  //Match all store products to ingredients, with a match score to determine certainty
  await sqlHandler.CreateIngredientMatches();

  // await sqlHandler.GetCheapestPriceForAllRecipe();
  res();
});
sqlTask();
const updateInterval = setInterval(sqlTask, 1000 * 60 * 60 * 24);

/*
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
}); commented out for development, but can be used for production build  to serve the React app from Express */