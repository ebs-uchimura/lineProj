/**
 * sql.js
 *
 * name：SQL
 * function：SQL operation
 **/

// define modules
const DB = require("./db.js");
require("dotenv").config();

// DB
const myDB = new DB(
    process.env.SQL_HOST, // hostname
    process.env.SQL_SUPREUSER, // username
    process.env.SQL_SUPERPASS, // password
    process.env.SQL_DBNAME // DBname
);

class SQL {
  // construnctor
  constructor(table) {
    this.table = table;
  }

  // select
  selectDB(column1, value1, column2, value2, field, order, limit, flg) {
    return new Promise(async (resolve, reject) => {
      try {
        // query string
        let queryString = '';
        // array
        let placeholder = [];

        // field
        if (field) {

          // if column1 not null
          if (column1) {
            // query
            queryString = "SELECT ?? FROM ?? WHERE ?? IN (?)";
            placeholder = [field, this.table, column1, value1];

          // if column1 null
          } else {
            // query
            queryString = 'SELECT ?? FROM ??';
            placeholder = [field, this.table];
          }
              
        } else {

          // if column1 not null
          if (column1) {
            // query
            queryString = "SELECT * FROM ?? WHERE ?? IN (?)";
            placeholder = [this.table, column1, value1];

          // if column1 null
          } else {
            // query
            queryString = "SELECT * FROM ??";
            placeholder = [this.table];
          }
        }

        // if double query
        if (column1 && column2) {
            queryString += ' AND ?? IN (?)';
            placeholder.push(column2);
            placeholder.push(value2);
        }

        // if recent only
        if (flg) {

          // if double search
          if (column1) {
            queryString += ' AND ?? > date(current_timestamp - interval 1 day)';

          // if single search
          } else {
              queryString += ' WHERE ?? > date(current_timestamp - interval 1 day)';
          }
          // push 'created_at'
          placeholder.push('created_at');
        }

        // if order exists
        if (order) {
          queryString += ' ORDER BY ?? DESC';
          placeholder.push(order);
        }

        // if limit exists
        if (limit) {
          queryString += ' LIMIT ?';
          placeholder.push(limit);
        }
        
        // do query
        await myDB.doInquiry(queryString, placeholder);
        // resolve
        resolve(myDB.getValue);
        
      } catch (e) {
        // error
        reject(e);
      }
    });
  }

  // select from database fuzzily
  fuzzySelectDB(column, value, field, order, limit) {
    return new Promise(async (resolve, reject) => {
      try {
        let queryString = "";
        let placeholder = "";

        if (field) {
          // query
          queryString =
              "SELECT ?? FROM ?? WHERE ?? LIKE CONCAT('%',?,'%') ORDER BY ?? DESC";
          // placeholder
          placeholder = [field, this.table, column, value, order];

        } else {
          // query
          queryString =
              "SELECT * FROM ?? WHERE ?? LIKE CONCAT('%',?,'%') ORDER BY ?? DESC";
          // placeholder
          placeholder = [this.table, column, value, order];
        }

        // if limit exists
        if (limit) {
          queryString += " LIMIT ?";
          placeholder.push(limit);
        }
        // do query
        await myDB.doInquiry(queryString, placeholder);
        // resolve
        resolve(myDB.getValue);
        
      } catch (e) {
        // error
        reject(e);
      }
    });
  }

  // update
  updateDB(setcol, setval, selcol, selval) {
    return new Promise(async (resolve, reject) => {
      try {
        // query
        await myDB.doInquiry('UPDATE ?? SET ?? = ? WHERE ?? = ?', [
          this.table,
          setcol,
          setval,
          selcol,
          selval,
        ]);
        // resolve
        resolve();

      } catch (e) {
        // error
        reject(e);
      }
    });
  }

  // insert
  insertDB = (columns, values) => {
    return new Promise(async (resolve, reject) => {
      try {
        // query
        await myDB.doInquiry('INSERT INTO ??(??) VALUES (?)', [this.table, columns, values]);
        // resolve
        resolve(myDB.getValue);

      } catch (e) {
        // error
        reject(e);
      }
    });
  }

  // empty or not
  static isEmpty(obj) {
    // check whether blank
    return !Object.keys(obj).length;
  }

}

// export module
module.exports = SQL;
