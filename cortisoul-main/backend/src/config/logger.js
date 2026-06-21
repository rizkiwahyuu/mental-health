import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, errors, colorize, splat, uncolorize } =
  format;

const logFormat = printf(({ timestamp, level, message, stack }) => {
  if (stack) {
    return `${timestamp} ${level}: ${message}\n${stack}`;
  }
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    splat(),
    process.env.NODE_ENV !== 'production' ? colorize() : uncolorize(),
    logFormat
  ),
  /* eslint-disable indent */
  transports: [
    new transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exitOnError: false,
});

export default logger;
