require('dotenv').config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

const baseConnection = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl,
  },
  migrations: { directory: './src/migrations' },
  seeds: { directory: './src/seeds' },
};

module.exports = {
  development: baseConnection,
  production: baseConnection,
};