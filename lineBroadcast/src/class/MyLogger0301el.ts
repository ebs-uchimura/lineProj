/**
 * MyElLogger.ts
 *
 * name：ELLogger
 * function：Logging operation
 * updated: 2024/03/01
 **/

// define modules
import * as path from 'path'; // path
import logger from 'electron-log'; // Logger

// Logger class
class ELLogger {
  // construnctor
  constructor(dirpath: string, filename: string) {
    // Logger config
    const prefix: string = getNowDate(0);
    // filename tmp
    logger.transports.file.fileName = `${filename}.log`;
    // filename tmp
    logger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
    // filename now
    const curr: string = logger.transports.file.fileName;
    // file saving path
    logger.transports.file.resolvePathFn = () => path.join(__dirname, `${dirpath}/${prefix}_${curr}`);
  }

  // debug
  debug = (message: string) => {
    logger.debug(message);
  }

  // inquire
  info = (message: string) => {
    logger.info(message);
  }

  // empty or not
  error = (e: unknown) => {
    if (e instanceof Error) {
      // error
      logger.error(process.pid, e.message);
    }
  }
}

// get now date
const getNowDate = (diff: number): string => {
  // now
  const d: Date = new Date();
  // combine date string
  const prefix: string = d.getFullYear() +
    ('00' + (d.getMonth() + 1)).slice(-2) +
    ('00' + (d.getDate() + diff)).slice(-2);
  return prefix;
}

// export module
export default ELLogger;