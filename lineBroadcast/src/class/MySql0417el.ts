/**
 * MySql.ts
 *
 * name：SQL
 * function：SQL operation
 * updated: 2024/04/17
 **/

// import global interface
import { } from "../../@types/globalsql";

// define modules
import * as mysql from 'mysql2'; // mysql
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
    SQL.pool = mysql.createPool({
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

  // count db
  countDB = async (args: countargs): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        logger.debug('db: countDB mode');
        // total
        let total: number;
        // query string
        let queryString: string;
        // array
        let placeholder: any[];

        // query
        queryString = 'SELECT COUNT(*) FROM ??';
        // placeholder
        placeholder = [args.table];

        // if column not null
        if (args.columns.length > 0 && args.values.length > 0) {
          // add where phrase
          queryString += ' WHERE';
          // values
          let values: any[] = args.values;
          // columns
          const columns: string[] = args.columns;

          // loop for array
          for (let i: number = 0; i < args.columns.length; i++) {
            // add in phrase
            queryString += ' ?? IN (?)';
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < args.columns.length - 1) {
              // add 'and' phrase
              queryString += ' AND';
            }
          }
        }

        // do query
        await this.doInquiry(queryString, placeholder).then((result: any) => {
          // result exists
          if (result !== 'error') {
            total = result[0]['COUNT(*)'];

          } else {
            total = 0;
          }
          logger.debug(`count: total is ${total}`);
          // return total
          resolve(total);

        }).catch((err: unknown) => {
          // error
          logger.error(err);
          resolve(0);
        });

      } catch (e: unknown) {
        // error
        logger.error(e);
        resolve(0);
      }
    });
  }

  // count join db
  countJoinDB = async (args: countjoinargs): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        logger.debug('db: countjoinDB mode');
        // total
        let total: number;
        // query string
        let queryString: string;
        // array
        let placeholder: any[];

        // query
        queryString = 'SELECT COUNT(??.id) FROM ?? INNER JOIN ?? ON ??.?? = ??.??';
        // placeholder
        placeholder = [args.table, args.table, args.jointable, args.table, args.joinid1, args.jointable, args.joinid2];

        // if column not null
        if (args.columns.length > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < args.columns.length; i++) {
            // add in phrase
            queryString += ' ??.?? IN (?)';
            // push table
            placeholder.push(args.table);
            // push column
            placeholder.push(args.columns[i]);
            // push value
            placeholder.push(args.values[i]);

            // other than last one
            if (i < args.columns.length) {
              // add and phrase
              queryString += ' AND';
            }
          }

          // if joincolumn not null
          if (args.joincolumns.length > 0) {
            // loop for array
            for (let j: number = 0; j < args.joincolumns.length; j++) {
              // add in phrase
              queryString += ' ??.?? IN (?)';
              // push table
              placeholder.push(args.jointable);
              // push column
              placeholder.push(args.joincolumns[j]);
              // push value
              placeholder.push(args.joinvalues[j]);

              // other than last one
              if (j < args.joincolumns.length - 1) {
                // add and phrase
                queryString += ' AND';
              }
            }
          }
        }

        // if column not null
        if (args.spantable && args.spancol && args.span) {
          // query
          queryString += ' AND ??.?? > date(current_timestamp - interval ? day)';
          // push span table
          placeholder.push(args.spantable);
          // push span column
          placeholder.push(args.spancol);
          // push span limit
          placeholder.push(args.span);
        }

        // do query
        await this.doInquiry(queryString, placeholder).then((result: any) => {
          // result exists
          if (result !== 'error') {
            total = result[0]['COUNT(`' + args.table + '`.id)'];

          } else {
            total = 0;
          }
          logger.debug(`countjoin: total is ${total}`);
          // return total
          resolve(total);

        }).catch((err: unknown) => {
          // error
          logger.error(err);
          resolve(0);
        });

      } catch (e: unknown) {
        // error
        logger.error(e);
        resolve(0);
      }
    });
  }

  // select db
  selectDB = async (args: selectargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        logger.debug('db: selectDB mode');
        // query string
        let queryString: string;
        // array
        let placeholder: any[];

        // if fields exists
        if (args.fields) {
          // query
          queryString = 'SELECT ?? FROM ??';
          // placeholder
          placeholder = [args.fields, args.table];

        } else {
          // query
          queryString = 'SELECT * FROM ??';
          // placeholder
          placeholder = [args.table];
        }

        // if column not null
        if (args.columns.length > 0 && args.values.length > 0) {
          // add where phrase
          queryString += ' WHERE';
          // values
          let values: any[] = args.values;
          // columns
          const columns: string[] = args.columns;
          // password index
          const passwordIdx: number = columns.indexOf('password');

          // include password
          if (passwordIdx > -1) {

            // it's string
            if (typeof (values[passwordIdx]) == 'string') {
              // password
              const passphrase: string = values[passwordIdx];

              // not empty
              if (passphrase != '') {
                // change to decrypted
                values[passwordIdx] = `AES_DECRYPT(UNHEX(${passphrase}), ${SQL.encryptkey})`;
              }
            }
          }

          // loop for array
          for (let i: number = 0; i < args.columns.length; i++) {
            // add in phrase
            queryString += ' ?? IN (?)';
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < args.columns.length - 1) {
              // add 'and' phrase
              queryString += ' AND';
            }
          }
        }

        // if column not null
        if (args.spancol && args.span) {
          // query
          queryString += ' AND ?? > date(current_timestamp - interval ? day)';
          // push span column
          placeholder.push(args.spancol);
          // push span limit
          placeholder.push(args.span);
        }

        // if order exists
        if (args.order) {
          // query
          queryString += ' ORDER BY ??';

          // if reverse
          if (args.reverse) {
            // query
            queryString += ' ASC';

          } else {
            // query
            queryString += ' DESC';
          }
          // push order key
          placeholder.push(args.order);
        }

        // if limit exists
        if (args.limit) {
          // query
          queryString += ' LIMIT ?';
          // push limit
          placeholder.push(args.limit);
        }

        // if offset exists
        if (args.offset) {
          // query
          queryString += ' OFFSET ?';
          // push offset
          placeholder.push(args.offset);
        }

        // do query
        await this.doInquiry(queryString, placeholder).then((result2: any) => {
          resolve(result2);
          logger.debug('select: db select success');

        }).catch((err: unknown) => {
          // error
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

  // select db with join
  selectJoinDB = async (args: joinargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        logger.debug('db: selectjoinDB mode');
        // query string
        let queryString: string;
        // array
        let placeholder: any[];

        // if fields exists
        if (args.fields) {
          // query
          queryString = 'SELECT ?? FROM ?? INNER JOIN ?? ON ??.?? = ??.??';
          // placeholder
          placeholder = [args.fields, args.table, args.jointable, args.table, args.joinid1, args.jointable, args.joinid2];

        } else {
          // query
          queryString = 'SELECT * FROM ?? INNER JOIN ?? ON ??.?? = ??.??';
          // placeholder
          placeholder = [args.table, args.jointable, args.table, args.joinid1, args.jointable, args.joinid2];
        }

        // if column not null
        if (args.columns.length > 0) {
          // add where phrase
          queryString += ' WHERE';
          // values
          let values: any[] = args.values;
          // columns
          const columns: string[] = args.columns;
          // password index
          const passwordIdx: number = columns.indexOf('password');

          // include password
          if (passwordIdx > -1) {

            // it's string
            if (typeof (values[passwordIdx]) == 'string') {
              // password
              const passphrase: string = values[passwordIdx];

              // not empty
              if (passphrase != '') {
                // change to decrypted
                values[passwordIdx] = `AES_DECRYPT(UNHEX(${passphrase}), ${SQL.encryptkey})`;
              }
            }
          }

          // loop for array
          for (let i: number = 0; i < args.columns.length; i++) {
            // add in phrase
            queryString += ' ??.?? IN (?)';
            // push table
            placeholder.push(args.table);
            // push column
            placeholder.push(args.columns[i]);
            // push value
            placeholder.push(args.values[i]);

            // other than last one
            if (i < args.columns.length - 1) {
              // add and phrase
              queryString += ' AND';
            }
          }

          // if joincolumn not null
          if (args.joincolumns.length > 0) {
            // loop for array
            for (let j: number = 0; j < args.joincolumns.length; j++) {
              // add in phrase
              queryString += ' ??.?? IN (?)';
              // push table
              placeholder.push(args.jointable);
              // push column
              placeholder.push(args.joincolumns[j]);
              // push value
              placeholder.push(args.joinvalues[j]);

              // other than last one
              if (j < args.joincolumns.length - 1) {
                // add and phrase
                queryString += ' AND';
              }
            }
          }

          // if column not null
          if (args.spantable && args.spancol && args.span) {
            // query
            queryString += ' AND ??.?? > date(current_timestamp - interval ? day)';
            // push span table
            placeholder.push(args.spantable);
            // push span column
            placeholder.push(args.spancol);
            // push span limit
            placeholder.push(args.span);
          }

          // if order exists
          if (args.order) {
            // query
            queryString += ' ORDER BY ??.??';

            // if reverse
            if (args.reverse) {
              // query
              queryString += ' DESC';

            } else {
              // query
              queryString += ' ASC';
            }

            // if order exists
            if (args.ordertable) {
              // push ordertable
              placeholder.push(args.ordertable);

            } else {
              // push maintable
              placeholder.push(args.table);
            }

            // push order key
            placeholder.push(args.order);
          }

          // if limit exists
          if (args.limit) {
            // query
            queryString += ' LIMIT ?';
            // push limit
            placeholder.push(args.limit);
          }

          // if offset exists
          if (args.offset) {
            // query
            queryString += ' OFFSET ?';
            // push offset
            placeholder.push(args.offset);
          }

          // do query
          await this.doInquiry(queryString, placeholder).then((result2: any) => {
            resolve(result2);
            logger.debug('select: db selectjoin success');

          }).catch((err: unknown) => {
            // error
            logger.error(err);
            resolve('error');
          });
        }

      } catch (e: unknown) {
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