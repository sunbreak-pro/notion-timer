import log from 'electron-log/main';
import * as path from 'path';
import { app } from 'electron';

// File transport: userData/logs/main.log, max 2MB, 5 rotations
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('userData'), 'logs', 'main.log');
log.transports.file.maxSize = 2 * 1024 * 1024; // 2MB

// Console transport: info in dev, warn in prod
const isDev = !app.isPackaged;
log.transports.console.level = isDev ? 'info' : 'warn';
log.transports.file.level = 'info';

// Global error handlers
process.on('uncaughtException', (error) => {
  log.error('[UncaughtException]', error);
});
process.on('unhandledRejection', (reason) => {
  log.error('[UnhandledRejection]', reason);
});

export default log;
