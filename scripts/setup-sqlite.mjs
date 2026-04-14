import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const prismaDirectory = path.join(root, "prisma");
const migrationPath = path.join(
  prismaDirectory,
  "migrations",
  "202604140001_init",
  "migration.sql",
);

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `Unsupported DATABASE_URL for SQLite setup: ${databaseUrl}`,
    );
  }

  const sqlitePath = databaseUrl.slice("file:".length);

  if (!sqlitePath) {
    throw new Error("DATABASE_URL must include a SQLite file path.");
  }

  if (path.isAbsolute(sqlitePath)) {
    return sqlitePath;
  }

  return path.resolve(prismaDirectory, sqlitePath);
}

const databasePath = resolveDatabasePath();

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const migrationBuffer = fs.readFileSync(migrationPath);
const rawSql =
  migrationBuffer[0] === 0xff && migrationBuffer[1] === 0xfe
    ? migrationBuffer.toString("utf16le").replace(/^\uFEFF/, "")
    : migrationBuffer.toString("utf8").replace(/^\uFEFF/, "");
const idempotentSql = rawSql
  .replaceAll('CREATE TABLE "', 'CREATE TABLE IF NOT EXISTS "')
  .replaceAll('CREATE INDEX "', 'CREATE INDEX IF NOT EXISTS "');

const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON;");
database.exec(idempotentSql);
database.close();

console.log(`SQLite database ready at ${databasePath}`);
