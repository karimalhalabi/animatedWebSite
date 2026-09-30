import mysql from "mysql2/promise";
import { Sequelize } from "sequelize";
const name = process.env.DB_NAME || "liqa";
if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error("Invalid DB_NAME");
const connection = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "liqa",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET ? { socketPath: process.env.DB_SOCKET } : {}),
};
export const sequelize = new Sequelize(
  name,
  connection.user,
  connection.password,
  {
    dialect: "mysql",
    host: connection.host,
    port: connection.port,
    dialectOptions: process.env.DB_SOCKET
      ? { socketPath: process.env.DB_SOCKET }
      : {},
    logging: false,
    define: { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
  },
);
export async function ensureDatabase() {
  const db = await mysql.createConnection(connection);
  try {
    await db.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await db.end();
  }
}
