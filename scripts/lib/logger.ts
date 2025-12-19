/**
 * Simple logger for pipeline scripts
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

const colors = {
  info: '\x1b[36m',    // cyan
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  success: '\x1b[32m', // green
  debug: '\x1b[90m',   // gray
  reset: '\x1b[0m',
};

const icons = {
  info: 'ℹ',
  warn: '⚠',
  error: '✖',
  success: '✔',
  debug: '·',
};

class Logger {
  private context: string;
  private startTime: number;

  constructor(context: string) {
    this.context = context;
    this.startTime = Date.now();
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const color = colors[level];
    const icon = icons[level];
    const timestamp = new Date().toISOString().slice(11, 19);

    console.log(
      `${colors.debug}[${timestamp}]${colors.reset} ${color}${icon}${colors.reset} ${colors.debug}[${this.context}]${colors.reset} ${message}`
    );

    if (data !== undefined) {
      console.log(colors.debug, JSON.stringify(data, null, 2), colors.reset);
    }
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data);
  }

  success(message: string, data?: unknown) {
    this.log('success', message, data);
  }

  debug(message: string, data?: unknown) {
    if (process.env.DEBUG) {
      this.log('debug', message, data);
    }
  }

  progress(current: number, total: number, label = '') {
    const pct = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r${colors.info}${bar}${colors.reset} ${pct}% (${current}/${total}) ${label}`);
    if (current === total) console.log();
  }

  elapsed(): string {
    const ms = Date.now() - this.startTime;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  done(message = 'Complete') {
    this.success(`${message} in ${this.elapsed()}`);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
