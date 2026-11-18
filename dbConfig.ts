export interface ResolvedDbEnvConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  hasExplicitHost: boolean;
  hasExplicitDbOrUser: boolean;
}

function parseDatabaseUrl(): Partial<ResolvedDbEnvConfig> {
  const rawUrl = (process.env.DATABASE_URL || process.env.MYSQL_URL || '').trim();
  if (!rawUrl) return {};
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.protocol.startsWith('mysql')) return {};
    return {
      host: parsed.hostname || undefined,
      port: parsed.port ? Number(parsed.port) : undefined,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password !== undefined ? decodeURIComponent(parsed.password) : undefined,
      database: parsed.pathname ? parsed.pathname.replace(/^\/+/, '') : undefined,
      ssl: parsed.searchParams.get('ssl') === 'true' || parsed.searchParams.get('sslmode') === 'REQUIRED'
    };
  } catch {
    return {};
  }
}

export function getEffectiveDbPort(overridePort?: number): number {
  const urlCfg = parseDatabaseUrl();
  let rawPort = Number(overridePort || process.env.MYSQL_PORT || process.env.DB_PORT || urlCfg.port);
  if (!rawPort || isNaN(rawPort) || rawPort <= 0 || rawPort > 65535 || rawPort === 3386) {
    rawPort = 3306;
  }
  return rawPort;
}

export function getDbEnvConfig(): ResolvedDbEnvConfig {
  const urlCfg = parseDatabaseUrl();
  const explicitHost = (process.env.MYSQL_HOST || process.env.DB_HOST || urlCfg.host || '').trim();
  const explicitUser = (process.env.MYSQL_USER || process.env.DB_USER || urlCfg.user || '').trim();
  const explicitDb = (process.env.MYSQL_DATABASE || process.env.DB_NAME || urlCfg.database || '').trim();
  const explicitPassword =
    process.env.MYSQL_PASSWORD !== undefined
      ? process.env.MYSQL_PASSWORD
      : process.env.DB_PASSWORD !== undefined
        ? process.env.DB_PASSWORD
        : urlCfg.password;

  const sslRaw = (process.env.MYSQL_SSL || process.env.DB_SSL || '').trim().toLowerCase();
  const ssl = sslRaw ? sslRaw === 'true' || sslRaw === '1' : Boolean(urlCfg.ssl);

  return {
    host: explicitHost || '118.139.180.163',
    port: getEffectiveDbPort(),
    user: explicitUser || 'khema_dbuser',
    password: explicitPassword !== undefined ? explicitPassword : 'Y+k,C=JAEA4nR+0*',
    database: explicitDb || 'khema_ainotes',
    ssl,
    hasExplicitHost: Boolean(explicitHost),
    hasExplicitDbOrUser: Boolean(explicitUser || explicitDb)
  };
}
