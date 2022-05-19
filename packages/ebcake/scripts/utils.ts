import * as path from 'path';
import chalk from 'chalk';

const repoBasePath = path.resolve(path.dirname(path.join(__dirname, '/../../../../')));

function getCallerLine() {
  return new Error().stack!.split('\n')[4].split(':')[1];
}

function getCallerFile() {
  return new Error().stack!.split('\n')[4].split(':')[0].split('(')[1];
}

export function useLogger(prefix: string) {
  if (prefix.startsWith(repoBasePath)) {
    prefix = path.basename(prefix);
  }
  const prefixStr = () => {
    const callerFileName = getCallerFile();
    let processedPrefix = prefix;
    if (path.basename(callerFileName) !== processedPrefix) {
      processedPrefix = `${processedPrefix}@${path.basename(callerFileName)}`;
    }
    return `${chalk.cyanBright(chalk.bold(`${processedPrefix}:${getCallerLine()}`))}: `;
  };
  return {
    ...console,
    assert: (value: unknown, message?: string, ...optionalParams: unknown[]) => {
      return console.assert(value, `${prefixStr()}${message}`, ...optionalParams);
    },
    count: (label?: string): void => {
      return console.count(`${prefixStr()}${label}`);
    },
    countReset: (label?: string): void => {
      return console.count(`${prefixStr()}${label}`);
    },

    ...Object.fromEntries(
      ['debug', 'error', 'info', 'log', 'warn', 'trace'].map((level) => {
        return [
          level,
          (message?: any, ...optionalParams: any[]): void => {
            return console[level as 'debug' | 'error' | 'info' | 'log' | 'warn' | 'trace'](
              prefixStr(),
              message,
              ...optionalParams,
            );
          },
        ];
      }),
    ),

    time: (label?: string): void => {
      return console.time(`${prefixStr()}${label}`);
    },
    timeEnd: (label?: string): void => {
      return console.timeEnd(`${prefixStr()}${label}`);
    },
    timeLog: (label?: string): void => {
      return console.timeLog(`${prefixStr()}${label}`);
    },
  };
}
