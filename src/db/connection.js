export function getMySqlConnectionOptions() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }

  if (!process.env.AIVEN_CA_CERT_BASE64) {
    throw new Error("Falta la variable de entorno AIVEN_CA_CERT_BASE64");
  }

  const databaseUrl = new URL(process.env.DATABASE_URL);

  return {
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(databaseUrl.pathname.slice(1)),
    ssl: {
      ca: Buffer.from(process.env.AIVEN_CA_CERT_BASE64, "base64").toString("utf8"),
      rejectUnauthorized: true,
    },
  };
}
