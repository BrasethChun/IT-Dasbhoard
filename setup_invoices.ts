import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: '118.139.180.163',
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR(36) PRIMARY KEY,
          invoice_no VARCHAR(50),
          date VARCHAR(50),
          billed_to TEXT,
          from_address TEXT,
          items JSON,
          total DECIMAL(10,2),
          payment_method VARCHAR(50),
          note TEXT,
          user_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Invoices table created');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
