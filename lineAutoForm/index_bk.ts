/**
 * index.ts
 *
 * function：LINE WEBHOOK サーバ
 **/

// import global interface
import { } from "../@types/global";

// モジュール
import { config as dotenv } from 'dotenv'; // 隠蔽用
import * as path from 'path'; // パス
import express from 'express'; // express
import log4js from 'log4js'; // ロガー
import axios from 'axios'; // http通信用
import helmet from 'helmet'; // セキュリティ対策
import sanitizeHtml from 'sanitize-html'; // サニタイズ用
import SQL from '../class/MySql0410'; // DB操作用
import CacheService from '../class/MyNodeCache0411'; // キャッシュ用

// モジュール設定
dotenv({ path: path.join(__dirname, '../keys/.env') });
// ロガー設定
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    system: { type: 'file', filename: '../logs/access.log' }
  },
  categories: {
    default: { appenders: ['out', 'system'], level: 'debug' }
  }
});
const logger: any = log4js.getLogger();

// 定数
const LINE_DEFAULTURL: string = process.env.LINE_DEFAULTURL!; // LINEリプライURL
const PORT: number = Number(process.env.PORT); // ポート番号
const TOKEN: string = process.env.LINE_ACCESS_TOKEN!; // LINEアクセストークン

// DB設定
const myDB: SQL = new SQL(
  process.env.SQL_HOST!, // ホスト名
  process.env.SQL_ADMINUSER!, // ユーザ名
  process.env.SQL_ADMINPASS!, // ユーザパスワード
  Number(process.env.SQLPORT), // ポート番号
  process.env.SQL_DBNAME!, // DB名
);

// express設定
const app: any = express();

// express設定
app.use(express.json()); // json設定
app.use(
  express.urlencoded({
    extended: true, // body parser使用
  })
);

// ヘルメットを使用する
app.use(helmet());

// テスト用
app.get('/', (_: any, res: any) => {
  res.send('connected.');
});

// WEBHOOK
app.post('/webhook', async (req: any, _: any) => {
  // モード
  try {
    logger.debug('webhook mode');
    // メッセージ
    let dataString: string = '';// 暗号化インスタンス
    // タイプ
    const eventtype: string = req.body.events[0].type ?? '';
    // LINEユーザID
    const userId: string = req.body.events[0].source.userId ?? '';
    // 返信トークン
    const replyToken: string = req.body.events[0].replyToken ?? '';
    // メッセージ
    const messageStr: string = zen2han(sanitizeHtml(req.body.events[0].message.text)).toLowerCase() ?? '';

    // 友だち追加時
    if (eventtype == 'follow') {
      // 初回挨拶
      dataString = JSON.stringify({
        replyToken: replyToken, // 返信トークン
        messages: [
          {
            type: "text",
            text: `〇〇さん\n\n秘密のオリシャンの体験モニターへのご参加ありがとうございます。\n\nあと6個のかんたんなインタビューにこたえるだけで、あなたのお店だけのオリシャンが届きます。\n\n▼お店の名前\n回答↓`,
          },
        ],
      });

    } else if (eventtype == 'message') {

      // メッセージ内容により分岐
      if (messageStr == "process:1" || messageStr == "process:2") {
        // 決済方法前メッセージ
        const subString: string = JSON.stringify({
          replyToken: replyToken, // 返信トークン
          messages: [
            {
              type: "text",
              text: "ご入力ありがとうございます。\n▼今回の決済方法をお選びください",
            },
          ],
        });
        // メッセージ送付
        sendMessage(subString);

        // 支払方法ID
        const paymentid: any = messageStr.split(':')[1];

        // 対象データ
        const uploadUserArgs: uploadargs = {
          table: 'lineuser', // テーブル
          setcol: 'payment_id', // 遷移先URL
          setval: Number(paymentid), // 遷移先URL値
          selcol: 'replytoken', // 対象ID
          selval: replyToken, // 対象ID値
        }
        // DBアップデート
        const lineuserDel: string | Object[] = await myDB.updateDB(uploadUserArgs);

        // 完了
        if (typeof (lineuserDel) !== 'string') {
          // 更新メッセージ
          logger.debug(`${replyToken} updated`);
        }

        // 対象データ
        const userSelectArgs: selectargs = {
          table: 'lineuser', // テーブル
          columns: ['replytoken', 'usable'], // カラム
          values: [replyToken, 1], // 値
        }
        // ユーザ抽出
        const tmpLineuserData: string | resultobj = await myDB.selectDB(userSelectArgs);

        // エラー
        if (typeof (tmpLineuserData) === 'string') {
          throw new Error('user search error');
        }

      } else if (messageStr != '') {
        // 対象データ
        const paySelectArgs: selectargs = {
          table: 'payment', // テーブル
          columns: ['usable'], // カラム
          values: [1], // 値
        }
        // 支払方法抽出
        const tmpPaymentData: string | resultobj = await myDB.selectDB(paySelectArgs);

        // エラー
        if (typeof (tmpPaymentData) === 'string') {
          throw new Error('payment search error');
        }

        // ユーザIDと返信トークンあり
        if (userId != '' && replyToken != '') {
          // 対象データ
          const insertUserArgs: insertargs = {
            table: 'lineuser',
            columns: [
              'userid',
              'shopname',
              'replytoken',
              'usable',
            ],
            values: [
              userId,
              messageStr,
              replyToken,
              1,
            ],
          }
          // トランザクションDB格納
          const tmpReg: any = await myDB.insertDB(insertUserArgs);

          // エラー
          if (tmpReg == 'error') {
            throw new Error('lineuser insertion error');

          } else {
            logger.debug('initial insertion to lineuser completed.');
          }
        }
      }
    }
    // メッセージ送付
    sendMessage(dataString);

  } catch (e: unknown) {
    // エラー
    logger.error(e);
  }
});

// 3001番待機
app.listen(PORT, () => {
  console.log(`awalove server listening at http://localhost:${PORT}`);
});

// メッセージ送付
const sendMessage = async (dtString: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 対象データ
      let targetData: any;
      // ヘッダ
      const headers: any = {
        'Content-Type': 'application/json', // Content-type
        Authorization: 'Bearer ' + TOKEN, // 認証トークン
      }

      // post送信
      axios.post(LINE_DEFAULTURL, dtString, {
        headers: headers // ヘッダ

      }).then((response: any) => {
        // 対象データ
        targetData = response.data.LinkUrl;

        // 受信データ
        if (targetData != 'error') {
          // リンクURL返し
          resolve(targetData);

        } else {
          // エラー返し
          reject('error');
        }

      }).catch((err: unknown) => {
        // エラー
        logger.error(err);
      });

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      reject('error');
    }
  });
}

// メッセージ整形
const zen2han = (input: string): string => {
  return input.replace(/[！-～]/g,
    input => {
      return String.fromCharCode(input.charCodeAt(0) - 0xFEE0);
    }
  );
}
