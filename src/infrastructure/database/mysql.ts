import * as mysql from "mysql2/promise";

let connection: mysql.Connection | null = null;

export async function getConnection(schema) {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: schema,
    });
  }
  return connection;
}
