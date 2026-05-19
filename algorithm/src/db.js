require('dotenv').config();
const { Pool } = require('pg');


// const array = Object.entries(process.env);
// array.forEach(e => console.log(e));
// console.log(process.env.os)

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }

});
pool.connect()
.then(() => console.log('Connected to the database'))
.catch((err) => console.error('Database connection error:', err));
module.exports = pool;

