require('dotenv').config();
const knex = require('knex');

// DB_SSL=true dipakai untuk host terkelola seperti Aiven yang mewajibkan
// koneksi terenkripsi. Lokal (XAMPP/Laragon) tidak perlu set ini.
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl,
  },
  pool: { min: 0, max: 5 },
});

module.exports = db;