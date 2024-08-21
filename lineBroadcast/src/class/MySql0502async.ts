/**
 * MySql.ts
 *
 * name：SQL
 * function：SQL operation
 * updated: 2024/05/2
 **/

// import global interface
import { } from "../../@types/globalsql";

// define modules
import * as mysql from 'mysql2/promise'; // mysql
import ELLogger from './MyLogger0301el'; // ロガー

// init logger
const logger: ELLogger = new ELLogger('../logs', 'sql');

// SQL class
class SQL {

  static pool: any; // sql pool
  static encryptkey: string; // encryptkey

  // construnctor
  constructor(host: string, user: string, pass: string, port: number, db: string, key?: string) {
    logger.debug('db: initialize mode');
    // DB config
    SQL.pool = mysql.createConnection({
      host: host, // host
      user: user, // username
      password: pass, // password
      database: db, // db name
      port: port, // port number
      waitForConnections: true, // wait for conn
      idleTimeout: 1000000, // timeout(ms)
      insecureAuth: true // allow insecure
    });
    // encrypted key
    SQL.encryptkey = key!;
  }

  // inquire
  doInquiry = async (sql: string, inserts: string[]): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        // make query
        const qry: any = mysql.format(sql, inserts);
        // connect ot mysql
        const promisePool: any = SQL.pool.promise(); // spread pool
        const [rows, _] = await promisePool.query(qry); // query name

        // empty
        if (SQL.isEmpty(rows)) {
          // return error
          resolve('error');

        } else {
          // result object
          resolve(rows);
        }

      } catch (e: unknown) {
        // error
        logger.error(e);
        resolve('error');
      }
    });
  }

  // update
  updateDB = async (args: updateargs): Promise<any> => {
    return new Promise(async (resolve1) => {
      try {
        logger.debug('db: updateDB mode');

        // プロミス
        const promises: Promise<any>[] = [];

        // ループ
        for (let i = 0; i < args.setcol.length; i++) {
          // プロミス追加
          promises.push(
            new Promise(async (resolve2, reject2) => {
              // query string
              const queryString: string = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
              // array
              const placeholder: any[] = [
                args.table,
                args.setcol[i],
                args.setval[i],
                args.selcol,
                args.selval,
              ];
              // do query
              await this.doInquiry(queryString, placeholder).then((result: any) => {
                resolve2(result);
                logger.debug('select: db update success');

              }).catch((err: unknown) => {
                // error
                logger.error(err);
                reject2('error');
              });
            })
          )
        }
        // 全終了
        Promise.all(promises).then((results) => {
          resolve1(results);
        });

      } catch (e: unknown) {
        // error
        logger.error(e);
        resolve1('error');
      }
    });
  }

  // insert
  insertDB = async (args: insertargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        logger.info('db: insertDB mode');
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[] = args.values;
        // password index
        const passwordIdx: number = columns.indexOf('password');

        // include password
        if (passwordIdx > -1) {

          // it's string
          if (typeof (values[passwordIdx]) == 'string') {
            // password
            const passphrase: string = values[passwordIdx]

            // not empty
            if (passphrase != '') {
              // change to encrypted
              values[passwordIdx] = `HEX(AES_ENCRYPT(${passphrase},${SQL.encryptkey}))`;
            }
          }
        }
        // query string
        const queryString: string = 'INSERT INTO ??(??) VALUES (?)';
        // array
        const placeholder: any[] = [args.table, args.columns, values];

        // do query
        await this.doInquiry(queryString, placeholder).then((result: any) => {
          resolve(result);
          logger.debug('select: db insert success');

        }).catch((err: unknown) => {
          logger.error(err);
          resolve('error');
        });

      } catch (e: unknown) {
        // error
        logger.error(e);
        resolve('error');
      }
    });
  }

  // empty or not
  static isEmpty(obj: Object) {
    // check whether blank
    return !Object.keys(obj).length;
  }
}

// export module
export default SQL;