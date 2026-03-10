// server/index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/*
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
}); commented out for development, but can be used for production build  to serve the React app from Express */