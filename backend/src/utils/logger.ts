type LogMeta = Record<string, unknown> | undefined;

const format = (level: string, message: string, meta?: LogMeta): string => {
  const ts = new Date().toISOString();
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level}] ${message}${suffix}`;
};

export const logger = {
  info: (message: string, meta?: LogMeta) => console.log(format('INFO', message, meta)),
  warn: (message: string, meta?: LogMeta) => console.warn(format('WARN', message, meta)),
  error: (message: string, meta?: LogMeta) => console.error(format('ERROR', message, meta)),
};
