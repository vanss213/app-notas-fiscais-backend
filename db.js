const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "notasdb.cjo4s6a4u5bn.sa-east-1.rds.amazonaws.com",
  database: "notasdb",
  password: "MinhaSenha123!", 
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // necessário no AWS RDS
  },
});

module.exports = pool;


