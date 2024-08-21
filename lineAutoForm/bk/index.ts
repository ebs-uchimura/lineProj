/**
 * index.ts
 *
 * function：LINE WEBHOOK サーバ
 **/

// import global interface
import { } from '../@types/global';

// モジュール
import { config as dotenv } from 'dotenv'; // 隠蔽用
import * as path from 'path'; // パス
import express from 'express'; // express
import log4js from 'log4js'; // ロガー
import axios from 'axios'; // http通信用
import helmet from 'helmet'; // セキュリティ対策
import sanitizeHtml from 'sanitize-html'; // サニタイズ用
import SQL from '../class/MySql0410a'; // DB操作用
import CacheService from '../class/MyNodeCache0419'; // キャッシュ用

// モジュール設定
dotenv({ path: path.join(__dirname, '../keys/auto.env') });
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
  Number(process.env.SQL_PORT), // ポート番号
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
    // タイプ
    const eventtype: string = req.body.events[0].type ?? '';
    // LINEユーザID
    const userId: string = req.body.events[0].source.userId ?? '';
    // 返信トークン
    const replyToken: string = req.body.events[0].replyToken ?? '';
    // メッセージ一覧
    const messageArray: string[] = [
      '▼お店のお名前を入力してください',
      '▼お店のお電話番号を入力してください（携帯可）',
      '▼お店の郵便番号を入力してください',
      '▼お店のご住所を入力してください',
      '▼ラベルに入れたい文字を入力してください',
      '▼ラベルデザイン\nトーク画面下の【メニュー】\n↓\n【ラベルデザインテンプレート】\nからお好きな『ラベルNo』の番号をご入力ください。\n\n後ほどコンシェルジュより確認のご連絡をいたしますので、楽しみにお待ちください。',
    ];

    // 友だち追加時
    if (eventtype == 'follow') {
      logger.debug('follow mode');
      // キャッシュ初期化
      const cache0: any = CacheService.get(`${userId}-0`) ?? 'none';
      const cache1: any = CacheService.get(`${userId}-1`) ?? 'none';
      const cache2: any = CacheService.get(`${userId}-2`) ?? 'none';
      const cache3: any = CacheService.get(`${userId}-3`) ?? 'none';
      const cache4: any = CacheService.get(`${userId}-4`) ?? 'none';
      const cache5: any = CacheService.get(`${userId}-5`) ?? 'none';

      if (cache0 != 'none') {
        CacheService.del([`${userId}-0`]);
      }
      if (cache1 != 'none') {
        CacheService.del([`${userId}-1`]);
      }
      if (cache2 != 'none') {
        CacheService.del([`${userId}-2`]);
      }
      if (cache3 != 'none') {
        CacheService.del([`${userId}-3`]);
      }
      if (cache4 != 'none') {
        CacheService.del([`${userId}-4`]);
      }
      if (cache5 != 'none') {
        CacheService.del([`${userId}-5`]);
      }
      logger.debug('キャッシュをクリアしました');

      // キャッシュ
      const obj: any = {
        no: 0,
        message: 'init',
      };
      // キャッシュ保存
      CacheService.set(`${userId}-0`, obj);
      // 送付文章
      const initialString = JSON.stringify({
        replyToken: replyToken, // 返信トークン
        messages: [
          {
            type: 'text',
            text: messageArray[0],
          },
        ],
      });
      logger.debug('initialized cache.');
      // メッセージ送付
      sendMessage(initialString);
      logger.debug('sent initial message.');

    } else if (eventtype == 'message') {
      logger.debug('message mode');
      // 送付メッセージ
      let dataString: string = '';
      // 返信番号
      let responseNo: number = 0;
      // メッセージ
      const messageStr: string = zen2han(sanitizeHtml(req.body.events[0].message.text)).toLowerCase() ?? '';
      logger.debug(`received ${messageStr}`);

      // 初期
      const cache0: any = CacheService.get(`${userId}-0`) ?? 'none';
      // ①店舗名：
      const cache1: any = CacheService.get(`${userId}-1`) ?? 'none';
      // ②郵便番号：
      const cache2: any = CacheService.get(`${userId}-2`) ?? 'none';
      // ③店舗住所：
      const cache3: any = CacheService.get(`${userId}-3`) ?? 'none';
      // ④ラベル文字：
      const cache4: any = CacheService.get(`${userId}-4`) ?? 'none';
      // 終了：
      const cache5: any = CacheService.get(`${userId}-5`) ?? 'none';

      if (cache0 != 'none') {
        responseNo = 1;
      }
      if (cache1 != 'none') {
        responseNo = 2;
      }
      if (cache2 != 'none') {
        responseNo = 3;
      }
      if (cache3 != 'none') {
        responseNo = 4;
      }
      if (cache4 != 'none') {
        responseNo = 5;
      }
      if (cache5 != 'none') {
        responseNo = 6;
      }
      logger.debug(`response no is ${responseNo}`);

      // 対象
      if (responseNo > 0) {

        // 終了時
        if (responseNo == 5) {
          /// 配信カラム
          const lineuserColumns: string[] = [
            'userid',
            'name',
            'phone',
            'zipcode',
            'address',
            'labeltext',
            'done',
            'usable',
          ];
          // 配信値
          const lineuserValues: any[] = [
            userId,
            cache1.message,
            cache2.message,
            cache3.message,
            cache4.message,
            messageStr,
            1,
            1,
          ];

          const insertLineuserArgs: insertargs = {
            table: 'lineuser', // テーブル
            columns: lineuserColumns,
            values: lineuserValues,
          }
          // DB挿入
          const targetUp: any = await myDB.insertDB(insertLineuserArgs);

          // エラー
          if (targetUp == 'error') {
            // 初回以外
            throw new Error('ユーザ登録に失敗しました');
          }
          // キャッシュ
          const obj: any = {
            no: responseNo,
            message: '',
          };
          // キャッシュ保存
          CacheService.set(`${userId}-${responseNo}`, obj);
          // 送付文章
          dataString = JSON.stringify({
            replyToken: replyToken, // 返信トークン
            messages: [
              {
                type: 'text',
                text: messageArray[5],
              },
            ],
          });
          // メッセージ送付
          sendMessage(dataString);
          logger.debug('sent final message.');

        } else if (responseNo < 5) {
          // キャッシュ
          const obj: any = {
            no: responseNo,
            message: messageStr,
          };
          // キャッシュ保存
          CacheService.set(`${userId}-${responseNo}`, obj);
          // 送付文章
          dataString = JSON.stringify({
            replyToken: replyToken, // 返信トークン
            messages: [
              {
                type: 'text',
                text: messageArray[responseNo],
              },
            ],
          });
          // メッセージ送付
          sendMessage(dataString);
          logger.debug('sent default message.');

        } else {
          logger.debug('out of target.');
        }
      }
    }

  } catch (e: unknown) {
    // エラー
    // logger.error(e);-
  }
});

// 3001番待機
app.listen(PORT, () => {
  logger.debug(`awalove server listening at http://localhost:${PORT}`);
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
          resolve();

        } else {
          // エラー返し
          reject();
        }

      }).catch((err: unknown) => {
        // エラー
        logger.error(err);
      });

    } catch (e: unknown) {
      // エラー
      logger.error(e);
      reject();
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
