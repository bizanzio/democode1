import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET() {
  const host = process.env.DB_HOST || "10.42.81.5";
  const port = Number(process.env.DB_PORT || "3306");
  const database = process.env.MYSQL_DATABASE || "demodb";
  const user = process.env.MYSQL_USER || "demodbusr";
  const password = process.env.MYSQL_PASSWORD || "demodbpwd";

  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection({ host, port, database, user, password });

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS demo_visits (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        note VARCHAR(120) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.execute("INSERT INTO demo_visits (note) VALUES (?)", ["visit from Next.js demo"]);
    const [rows] = await connection.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS visits FROM demo_visits");

    return NextResponse.json({
      ok: true,
      database,
      host,
      visits: Number(rows[0]?.visits || 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ ok: false, database, host, error: message }, { status: 500 });
  } finally {
    await connection?.end().catch(() => undefined);
  }
}
