
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const env = require("./env");

const caCertificate = fs.readFileSync(
  path.join(__dirname, "../../certs/isrgrootx1.pem")
);

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT) || 4000,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  ssl: {
    minVersion: "TLSv1.2",
    ca: caCertificate,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
