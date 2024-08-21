/**
 * index.ts
 **
 * function：LINE配信用 アプリ
**/

// import global interface
import { } from '../@types/globalobj';

// モジュール
import { config as dotenv } from 'dotenv'; // 隠蔽用
import { BrowserWindow, app, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'; // electron
import * as path from 'path'; // path
import * as https from 'https'; // https
import { promises } from 'fs'; // ファイル操作
import iconv from 'iconv-lite'; // 文字コード変更
import sanitizeHtml from 'sanitize-html'; // サニタイズ
import ImageSize from 'image-size'; // 画像サイズ変更用
import Client from 'ssh2-sftp-client'; // sfptクライアント
import { parse } from 'csv-parse/sync'; // csvパーサ
import { stringify } from 'csv-stringify/sync'; // csv文字列化
import { setTimeout } from 'node:timers/promises'; // wait for seconds
import ELLogger from './class/MyLogger0301el'; // ロガー
import SQL from './class/MySql0417el'; // DB操作

// ファイル読み込み用
const { readFile, writeFile } = promises;

// 定数
const DEV_FLG: boolean = false; // 開発フラグ
const PAGECOUNT: number = 15; // ページ表示件数
const CSV_ENCODING: string = 'Shift_JIS'; // エンコーディング
const CHOOSE_CSV_FILE: string = '読み込むCSVを選択してください。'; // CSVファイル選択ダイアログ
const CHOOSE_IMG_FILE: string = '読み込む画像を選択してください。'; // 画像ファイル選択ダイアログ

// ログ設定
const logger: ELLogger = new ELLogger('logs', 'access');

// モジュール設定
dotenv({ path: path.join(__dirname, '../.env') });

// 開発環境切り替え
let sqlUser: string; // SQLユーザ名
let sqlPass: string; // SQLパスワード
let sqlDb: string; // SQLデータベース名

// 開発モード
if (DEV_FLG) {
  sqlUser = process.env.SQL_DEV_COMMONUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_DEV_COMMONPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DEV_DBNAME!; // SQLデータベース名

} else {
  sqlUser = process.env.SQL_COMMONUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_COMMONPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DBNAME!; // SQLデータベース名
}

// db
const myDB: SQL = new SQL(
  process.env.SQL_HOST!, // ホスト名
  sqlUser, // ユーザ名
  sqlPass, // パスワード
  Number(process.env.SQL_PORT), // ポート番号
  sqlDb, // DB名
);

// desktopパス取得
const dir_home: string = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'] ?? '';
const dir_desktop: string = path.join(dir_home, 'Desktop');

/*
 electron処理
*/
/* メイン */
// ウィンドウ定義
let mainWindow: Electron.BrowserWindow;
// 起動確認フラグ
let isQuiting: boolean;
// ウィンドウ作成
const createWindow = (): void => {
  try {
    // ウィンドウ
    mainWindow = new BrowserWindow({
      width: 1200, // 幅
      height: 1000, // 高さ
      webPreferences: {
        nodeIntegration: false, // Node.js利用不可
        contextIsolation: true, // コンテキスト分離
        preload: path.join(__dirname, 'preload.js'), // プリロード
      },
    });

    // メニューバー非表示
    mainWindow.setMenuBarVisibility(false);
    // index.htmlロード
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
    // 準備完了
    mainWindow.once('ready-to-show', () => {
      // 開発モード
      // mainWindow.webContents.openDevTools();
    });

    // 最小化のときはトレイ常駐
    mainWindow.on('minimize', (event: any): void => {
      logger.debug('window: minimize app');
      // キャンセル
      event.preventDefault();
      // ウィンドウを隠す
      mainWindow.hide();
      // falseを返す
      event.returnValue = false;
    });

    // 閉じる
    mainWindow.on('close', (event: any): void => {
      logger.debug('window: close app');
      // 起動中
      if (!isQuiting) {
        // apple以外
        if (process.platform !== 'darwin') {
          // 終了
          app.quit();
          // falseを返す
          event.returnValue = false;
        }
      }
    });

    // ウィンドウが閉じたら後片付けする
    mainWindow.on('closed', (): void => {
      logger.debug('window: closed app');
      // ウィンドウをクローズ
      mainWindow.destroy();
    });

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
}
// サンドボックス有効化
app.enableSandbox();

// メインプロセス(Nodejs)の多重起動防止
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.info('メインプロセスが多重起動しました。終了します。');
  app.quit();
}

// 処理開始
app.on('ready', () => {
  logger.debug('app: electron is ready');
  // ウィンドウを開く
  createWindow();
  // アイコン
  const icon: any = nativeImage.createFromPath(path.join(__dirname, '../assets/linebroadcast.ico'));
  // トレイ
  const mainTray: Electron.Tray = new Tray(icon);
  // コンテキストメニュー
  const contextMenu: Electron.Menu = Menu.buildFromTemplate([
    {
      // 表示
      label: '表示', click: () => {
        mainWindow.show();
      }
    },
    {
      // 閉じる
      label: '閉じる', click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);
  // コンテキストメニューセット
  mainTray.setContextMenu(contextMenu);
  // ダブルクリックで再表示
  mainTray.on('double-click', () => mainWindow.show());
});

// 起動時
app.on('activate', async () => {
  logger.debug('app: activate app');
  // 起動ウィンドウなし
  if (BrowserWindow.getAllWindows().length === 0) {
    // 再起動
    createWindow();
  }
});

// 閉じるボタン
app.on('before-quit', () => {
  logger.debug('app: before-quit app');
  isQuiting = true;
});

// 終了
app.on('window-all-closed', () => {
  logger.debug('app: window-all-closed app');
  // 閉じる
  app.quit();
})

/*
 IPC処理
*/
/* ページ表示 */
ipcMain.on('page', async (event, arg) => {
  try {
    logger.debug('ipc: page mode');
    // 遷移先
    let url: string = '';
    // プランマスタフラグ
    let planMasterFlg: boolean = false;
    // ジャンルマスタフラグ
    let genreMasterFlg: boolean = false;
    // チャネルマスタフラグ
    let channelMasterFlg: boolean = false;
    // 配信タイプフラグ
    let typeMethodMasterFlg: boolean = false;
    // 配信履歴フラグ
    let historyFlg: boolean = false;

    // ◇ 配信・プラン登録
    // urlセット
    switch (arg) {
      // トップモード
      case 'top_page':
        // 遷移先
        url = '../index.html';
        break;

      // 即時配信モード
      case 'immediate_page':
        // 遷移先
        url = '../immediate.html';
        break;

      // プランモード
      case 'regist_plan_page':
        // 遷移先
        url = '../registplan.html';
        break;

      // ジャンルモード
      case 'regist_genre_page':
        // 遷移先
        url = '../registgenre.html';
        break;

      // チャネルモード
      case 'regist_channel_page':
        // 遷移先
        url = '../registchannel.html';
        break;

      // ◇ 編集
      // 配信編集モード
      case 'history_page':
        // 遷移先
        url = '../history.html';
        break;

      default:
        // 遷移先
        url = '';
        logger.error('out of scope.');
    }
    logger.debug(`url: ${url}`);

    // ページ遷移
    await mainWindow.loadFile(path.join(__dirname, url));

    // urlセット
    switch (arg) {
      // 即時配信モード
      case 'immediate_page':
        // プラン対象
        planMasterFlg = true;
        // チャンネル対象
        channelMasterFlg = true;
        break;

      // プラン登録モード
      case 'regist_plan_page':
        // プラン対象
        planMasterFlg = true;
        // ジャンル対象
        genreMasterFlg = true;
        // 配信方法対象
        typeMethodMasterFlg = true;
        break;

      // ジャンル登録モード
      case 'regist_genre_page':
        // ジャンル対象
        genreMasterFlg = true;
        break;

      // チャンネル登録モード
      case 'regist_channel_page':
        // チャンネル対象
        channelMasterFlg = true;
        break;

      // 配信履歴モード
      case 'history_page':
        // 配信方法対象
        historyFlg = true;
        break;

      default:
        // 遷移先
        url = '';
        logger.error('out of scope.');
    }

    // チャネルマスタ
    if (channelMasterFlg) {
      logger.debug('channel master mode');
      // 対象データ
      const channelSelectArgs: selectargs = {
        table: 'channel', // テーブル
        columns: ['usable'], // カラム
        values: [1], // 値
      }
      // チャネル抽出
      const channelData: any = await myDB.selectDB(channelSelectArgs);

      // エラー
      if (channelData === 'error') {
        throw new Error('channel select error');

      } else {
        logger.debug('sql: channel select success');
        // チャネル一覧返し
        event.sender.send('channelMasterllist', channelData);
      }
    }

    // ジャンルマスタ
    if (genreMasterFlg) {
      logger.debug('genre master mode');
      // 対象データ
      const genreSelectArgs: selectargs = {
        table: 'genre', // テーブル
        columns: ['usable'], // カラム
        values: [1], // 値
      }
      // ジャンル抽出
      const genreData: any = await myDB.selectDB(genreSelectArgs);

      // エラー
      if (genreData === 'error') {
        throw new Error('genre select error');

      } else {
        logger.debug('sql: genre select success');
        // ジャンル一覧返し
        event.sender.send('genreMasterlist', genreData);
      }
    }

    // 配信方法マスタ
    if (typeMethodMasterFlg) {
      logger.debug('linemethod master mode');
      // 対象データ
      const linemethodSelectArgs: selectargs = {
        table: 'linemethod', // テーブル
        columns: ['usable'], // カラム
        values: [1], // 値
      }
      // 配信方法抽出
      const linemethodData: any = await myDB.selectDB(linemethodSelectArgs);

      // エラー
      if (linemethodData === 'error') {
        throw new Error('linemethod select error');

      } else {
        logger.debug('sql: linemethod select success');
        // 配信方法一覧返し
        event.sender.send('lineMethodMasterlist', linemethodData);
      }
    }

    // プランマスタ
    if (planMasterFlg) {
      logger.debug('plan master mode');
      // 対象データ
      const planSelectArgs: selectargs = {
        table: 'plan', // テーブル
        columns: ['usable'], // カラム
        values: [1], // 値
      }
      // プラン抽出
      const planData: any = await myDB.selectDB(planSelectArgs);

      // エラー
      if (planData === 'error') {
        throw new Error('plan select error');

      } else {
        logger.debug('sql: plan select success');
        // プラン一覧返し
        event.sender.send('planMasterllist', planData);
      }
    }

    // 配信履歴
    if (historyFlg) {
      logger.debug('broadcast history mode');
      // 履歴取得
      const resultObj: historyObj = await gethistory(0, PAGECOUNT);
      logger.debug('broadcast history extracted');
      // 配信履歴一覧
      event.sender.send('history_finish', resultObj);
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

/* 登録処理 */
// プラン登録
ipcMain.on('planregister', async (event, arg) => {
  try {
    logger.debug('ipc: planregister mode');
    // メイン画像ファイルURI
    let mainFileUri: string;
    // 画像幅
    let imgWidth: number;
    // 画像高
    let imgHeight: number;
    // プラン名
    const planname: string = sanitizeHtml(arg.planname);
    // 配信ID
    const linemethodId: number = Number(arg.linemethod);
    // ジャンルID
    const genreId: number = Number(arg.genre);
    // 標準遷移先URL
    const baseUrl: string = sanitizeHtml(arg.baseurl);
    // テキストボックス
    const planTexts: any[] = arg.textSet;
    // 画像パス
    const imagePath: string = arg.imagepath;
    // 画像パスリスト
    const imagePathData: string[] = arg.imagedata;
    // メイン画像ルート
    const baseHttpUri: string = 'https://ebisuan.sakura.ne.jp/assets/image/';
    // プラン対象カラム
    const planColumns: string[] = [
      'planname', // プラン名
      'genre_id', // ジャンルID
      'linemethod_id', // 配信ID
      'baseurl', // 標準遷移先URL
      'usable', // 利用可能
    ];
    // プラン対象値
    const planValues: any[] = [
      planname, // プラン名
      genreId, // ジャンルID
      linemethodId, // 配信ID
      baseUrl, // 標準遷移先URL
      1, // 利用可能
    ];
    // 対象データ
    const insertPlanArgs: insertargs = {
      table: 'plan', // テーブル
      columns: planColumns, // 対象カラム
      values: planValues, // 対象値
    }
    // プランDB格納
    const tmpPlanReg: any = await myDB.insertDB(insertPlanArgs);

    // プラン登録失敗
    if (tmpPlanReg == 'error') {
      throw new Error('プラン登録に失敗しました');

    } else {
      logger.debug('plan registered');
    }

    // 配信ID
    const insertedPlanId: number = tmpPlanReg.insertId;

    // 配信内容により条件分岐
    switch (linemethodId) {
      // テキスト
      case 1:
        logger.debug('1: text mode');
        // プランテキスト登録
        await registTxt(insertedPlanId, [planTexts[0]]);
        // 配信内容
        break;

      // 画像モード/選択肢モード
      case 2:
      case 3:
      case 4:
        logger.debug('2: image mode/ 3: option mode');
        // プランテキスト登録
        await registTxt(insertedPlanId, planTexts);

        // 画像URLあり
        if (imagePath == '') {
          // ジャンル一覧返し
          throw new Error('画像がありません');
        }
        // 画像アップロード
        const uploadResult: string = await uploadFile(imagePath);

        // アップロード成功
        if (uploadResult != 'success') {
          // ジャンル一覧返し
          throw new Error('画像登録に失敗しました');

        } else {
          logger.debug('upload success');
        }
        // メイン画像ファイル名
        mainFileUri = `${baseHttpUri}${path.basename(sanitizeHtml(imagePath))}`;

        // 画像モード
        if (linemethodId == 2) {
          // サイズ計測
          const dimensions: any = ImageSize(imagePath);
          // 画像幅
          imgWidth = dimensions.width;
          // 画像高
          imgHeight = dimensions.height;
          // 画像登録
          await registImage(insertedPlanId, mainFileUri, imgWidth, imgHeight);

        } else {
          // 画像登録
          await registImage(insertedPlanId, mainFileUri);
        }
        break;

      // カルーセルモード
      case 5:
        logger.debug('5: carroursel mode');
        // プランテキスト登録
        await registTxt(insertedPlanId, planTexts);

        // 画像URLあり
        if (imagePathData[0] == '') {
          // ジャンル一覧返し
          throw new Error('画像がありません');
        }

        // 画像リスト
        Promise.all(imagePathData.map(async (imgpath: any): Promise<string> => {
          return new Promise(async (resolve, _) => {
            try {
              // 画像アップロード-
              const uploadResult: string = await uploadFile(imgpath);

              // アップロード成功
              if (uploadResult != 'success') {
                // ジャンル一覧返し
                throw new Error('画像登録に失敗しました');
              }
              logger.debug('upload success');
              // メイン画像ファイル名
              mainFileUri = `${baseHttpUri}${path.basename(sanitizeHtml(imgpath))}`;
              // 結果
              resolve(mainFileUri);

            } catch (err: unknown) {
              // エラー型
              if (err instanceof Error) {
                // エラー
                logger.error(err.message);
              }
            }
          });

        })).then(async (data) => {
          // 画像登録
          await registImage(tmpPlanReg.insertId, data);
        });
        break;

      default:
        logger.debug('no linemethod');
    }
    // エラーメッセージ
    showmessage('info', 'プランを登録しました');
    // プラン一覧返し
    event.sender.send('operation_finish', 'plan');

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// ジャンル登録
ipcMain.on('genreregister', async (event, arg) => {
  try {
    logger.debug('ipc: genreregister mode');
    // ジャンル名
    const genrename: string = sanitizeHtml(arg);
    // ジャンル対象カラム
    const genreColumns: string[] = [
      'genrename', // ジャンル名
      'usable', // 使用可能
    ];
    // ジャンル対象値
    const genreValues: any[] = [
      genrename, // ジャンル名
      1, // 使用可能
    ];
    // 対象データ
    const insertGenreArgs: insertargs = {
      table: 'genre', // テーブル
      columns: genreColumns, // 対象カラム
      values: genreValues, // 対象値
    }
    // トランザクションDB格納
    const tmpTransReg: any = await myDB.insertDB(insertGenreArgs);

    // エラー
    if (tmpTransReg == 'error') {
      logger.error('ジャンル登録に失敗しました');

    } else {
      logger.debug('plan registered');
      // メッセージ表示
      showmessage('info', 'ジャンル登録に成功しました');
      // 完了
      event.sender.send('operation_finish', 'genre');
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// チャンネル登録
ipcMain.on('channelregist', async (event, arg) => {
  try {
    logger.debug('ipc: channelregist mode');
    // チャンネル名
    const channelname: string = sanitizeHtml(arg.channelname);
    // トークン
    const token: string = arg.token;
    // チャンネル対象カラム
    const channelColumns: string[] = [
      'channelname', // チャンネル名
      'token', // トークン
      'usable', // 使用可能
    ];
    // チャンネル対象値
    const channelValues: any = [
      channelname, // チャンネル名
      token, // トークン
      1, // 使用可能
    ];
    // 対象データ
    const insertChannelArgs: insertargs = {
      table: 'channel', // テーブル
      columns: channelColumns, // 対象カラム
      values: channelValues, // 対象値
    }
    // チャンネルDB格納
    const tmpChannelReg: any = await myDB.insertDB(insertChannelArgs);

    // エラー
    if (tmpChannelReg == 'error') {
      logger.error('チャンネル登録に失敗しました');

    } else {
      logger.debug('channel registered');
      // メッセージ表示
      showmessage('info', 'チャンネル登録に成功しました');
      // 完了
      event.sender.send('operation_finish', 'channel');
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// 削除
ipcMain.on('delete', async (event, arg) => {
  try {
    logger.debug('ipc: delete mode');
    // 対象ID
    const targetId: number = Number(arg.id);
    // 対象テーブル
    const targetname: string = arg.name;
    // 対象テーブル
    const targettable: string = arg.table;
    // オプション
    const options: Electron.MessageBoxSyncOptions = {
      type: 'warning', // タイプ
      message: '警告', // メッセージタイトル
      buttons: ['OK', 'Cancel'], // ボタン
      cancelId: -1,  // Esc で閉じられたときの戻り値
      detail: `${targetname} を削除してよろしいですか？`,  // 説明文
    };
    // ダイアログ表示
    const selected: number = dialog.showMessageBoxSync(options);

    // キャンセルなら離脱
    if (selected == 1 || selected == -1) {
      // 結果返し
      logger.error('キャンセルしました');
      return false;

    } else {
      // 対象データ
      const uploadTransArgs: updateargs = {
        table: targettable, // テーブル
        setcol: ['usable'], // 更新カラム
        setval: [0], // 更新値
        selcol: ['id'], // 対象ID
        selval: [targetId], // 対象ID値
      }
      // DBアップデート
      const targetDel: any = await myDB.updateDB(uploadTransArgs);

      // エラー
      if (targetDel !== 'error') {
        // 更新メッセージ
        logger.debug(`ID:${targetDel.insertId} updated`);
        // メッセージ表示
        showmessage('info', '削除が完了しました');
        // 配信ユーザ一覧返し
        event.sender.send('operation_finish', targetname);
      }
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// 画像選択
ipcMain.on('upload', async (event, arg) => {
  try {
    logger.debug('ipc: upload mode');
    // 画像ファイルパス取得
    const filepath: string | string[] = await getImageFile(arg);

    // エラーなし
    if (filepath != 'error') {
      // 表示用パス
      const displaypath: string = filepath.length == 1 ? filepath[0] : filepath[0] + '他';
      // 画像ファイルパス返し
      event.sender.send('image', {
        path: displaypath, // ファイルパス
        allpath: filepath // 画像ファイルパス
      });

    } else {
      // エラーメッセージ
      showmessage('error', 'ファイルが選択されていません');
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// CSV取得
ipcMain.on('csv', async (event, _) => {
  try {
    logger.debug('ipc: csv mode');
    // CSVデータ取得
    const result: any = await getCsvData();
    // 送付用
    const sendObj: recordType = {
      record: result.record.flat(), // CSVデータ
      filename: result.filename, // ファイル名
    }
    // 配信ユーザ一覧返し
    event.sender.send('usersCsvlist', sendObj);

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

/* 配信処理 */
// 即時配信
ipcMain.on('broadcast', async (event, arg) => {
  // 成功
  let successCounter: number = 0;
  // 失敗
  let failCounter: number = 0;

  try {
    logger.debug('ipc: broadcast mode');
    // idカウンタ
    let idCounter: number = 0;
    // 完了
    let doneFlg: number = 0;
    // 配信時間
    let broadcastTime: string;
    // 完了
    let messageObj: bdmessageobj = {
      contentTexts: [], // 配信テキスト集
      linkurls: [], // URL集
      imgurls: [], // 画像URL集
      width: 0, // 画像幅
      height: 0, // 画像高さ
    };
    // 配信名
    const broadcastname: string = sanitizeHtml(arg.bdname);
    // チャンネルID
    const channelId: number = Number(arg.channel);
    // プランID
    const planId: number = Number(arg.plan);
    // ユーザID
    const userNoArray: string[] = arg.users;
    // 合計数
    const totalUsers: number = userNoArray.length;
    // 現在時刻
    const nowDate: Date = new Date();

    // 対象無しエラー
    if (totalUsers == 0) {
      // 初回以外
      throw new Error('対象ユーザがいません');
    }
    logger.debug(`a number of users is ${totalUsers}`);
    // 配信時間
    broadcastTime = formatDateInYyyymmdd(nowDate);
    // 配信カラム
    const broadcastColumns: string[] = [
      'broadcastname', // 配信名
      'plan_id', // プランID
      'channel_id', // チャンネルID
      'sendtime', // 配信時間
      'done', // 完了
    ];
    // 配信値
    const broadcastValues: any[] = [
      broadcastname, // 配信名
      planId, // プランID
      channelId, // チャンネルID
      broadcastTime, // 配信時間
      0, // 完了
    ];
    // 対象データ
    const insertBroadcastArgs: insertargs = {
      table: 'broadcast', // テーブル
      columns: broadcastColumns, // 配信カラム
      values: broadcastValues, // 配信値
    }
    // トランザクションDB格納
    const tmpBdReg: any = await myDB.insertDB(insertBroadcastArgs);

    // エラー
    if (tmpBdReg == 'error') {
      // 登録成功
      throw new Error('配信登録に失敗しました');
    }
    // 登録失敗
    logger.debug('broadcast success');

    // 対象ID
    const targetBroadcastId: number = tmpBdReg.insertId;
    // チャンネル一覧
    // 対象データ
    const channelSelectArgs: selectargs = {
      table: 'channel', // テーブル
      columns: ['id'], // カラム
      values: [channelId], // 値
    }
    // チャンネル抽出
    const channelData: any = await myDB.selectDB(channelSelectArgs);

    // エラー
    if (channelData === 'error') {
      throw new Error('channel select error');

    } else {
      logger.debug('sql: channel select success');

    }
    // トークン
    const token: string = channelData[0].token;

    // プラン一覧
    const planSelectArgs: selectargs = {
      table: 'plan', // テーブル
      columns: ['id'], // カラム
      values: [planId], // 値
    }
    // プラン抽出
    const planData: any = await myDB.selectDB(planSelectArgs);

    // エラー
    if (planData === 'error') {
      throw new Error('plan select error');

    } else {
      logger.debug('sql: plan select success');
    }

    // プラン名
    const title: string = planData[0].planname;
    // LINE登録
    const linemethodno: number = planData[0].linemethod_id;

    // プランテキスト(画像モード以外)
    if (linemethodno != 2) {
      // プラン一覧
      const planTextSelectArgs: selectargs = {
        table: 'plantxt', // テーブル
        columns: ['plan_id'], // カラム
        values: [planId], // 値
      }
      // プラン抽出
      const planTxtData: any = await myDB.selectDB(planTextSelectArgs);

      // エラー
      if (planTxtData === 'error') {
        throw new Error('plantxt select error');

      } else {
        logger.debug('sql: plantxt select success');

        // txt
        if (Array.isArray(planTxtData)) {
          // 配信テキスト
          const txtArray: string[] = planTxtData.map((txt: any) => txt["plantxt"]);
          // 配信内容
          messageObj.contentTexts = txtArray;

        } else {
          // 配信内容
          messageObj.contentTexts = [planTxtData];
        }
      }
    }

    // プランURL
    if (linemethodno >= 3) {
      // プラン一覧
      const planTxtSelectArgs: selectargs = {
        table: 'plantxt', // テーブル
        columns: ['plan_id'], // カラム
        values: [planId], // 値
      }
      // プラン抽出
      const planTxtData: any = await myDB.selectDB(planTxtSelectArgs);

      // エラー
      if (planTxtData === 'error') {
        throw new Error('plantxt select error');

      } else {
        logger.debug('sql: plantxt select success');
        // url
        const urlArray: string[] = planTxtData.map((txt: any) => txt["url"]);
        // 配信url
        messageObj.linkurls = urlArray;
      }
    }

    // プラン画像
    if (linemethodno >= 2) {
      // プラン一覧
      const planImgSelectArgs: selectargs = {
        table: 'planimg', // テーブル
        columns: ['plan_id'], // カラム
        values: [planId], // 値
      }
      // プラン抽出
      const planImgData: any = await myDB.selectDB(planImgSelectArgs);

      // エラー
      if (planImgData === 'error') {
        throw new Error('planimg select error');

      } else {
        logger.debug('sql: planimg select success');

        // 配信内容により条件分岐
        switch (linemethodno) {
          // 画像
          case 2:
            // 画像幅
            messageObj.width = planImgData[0].imgwidth;
            // 画像高さ
            messageObj.height = planImgData[0].imgheight;
            // 画像URL
            messageObj.imgurls = [planImgData[0].planimgurl];
            break;

          // 選択肢
          case 3:
          case 4:
            // 画像URL
            messageObj.imgurls = [planImgData[0].planimgurl];
            break;

          // カルーセル
          /*
          case 5:
            // 画像URL
            const imgurlArray: string[] = planImgData.map((img: any) => img["planimgurl"]);
            // 画像URL集
            messageObj.imgurls = imgurlArray;
            break;
            */

          default:
            logger.debug('no linemethodno');
        }
      }
    }

    // 対象データ
    const lineuserSelectArgs: selectargs = {
      table: 'lineuser', // テーブル
      columns: ['customerno'], // カラム
      values: userNoArray, // 値
      fields: ['customerno', 'userid'] // カラム
    };
    // 配信抽出
    const lineUserIds: any = await myDB.selectDB(lineuserSelectArgs);

    // エラー
    if (lineUserIds === 'error') {
      throw new Error('lineuser select error');

    } else {
      logger.debug('sql: lineuser select success');
    }

    // 結果
    const resultArray: csvobj[] = await Promise.all(
      // LINEユーザID
      lineUserIds.map(async (uid: any): Promise<csvobj> => {
        return new Promise(async (resolve, _) => {
          try {
            // 結果
            const result: string = await sendLineMessage(uid.userid, title, linemethodno, messageObj.contentTexts, messageObj.linkurls, messageObj.imgurls, token, messageObj.width, messageObj.height);

            // 結果
            if (result == '〇') {
              // OK
              successCounter++;

            } else if (result == '×') {
              // NG
              failCounter++;
            }
            // オブジェクトID
            idCounter++;
            // 送付用店舗情報
            let tmpShopObj: csvobj = {
              ID: String(idCounter), // ID
              配信ID: String(targetBroadcastId), // 配信ID
              顧客番号: uid.customerno, // 顧客番号
              ユーザID: uid.userid, // ユーザID
              結果: result, // 結果
            };
            // 値返し
            resolve(tmpShopObj);

          } catch (err: unknown) {
            // エラー型
            if (err instanceof Error) {
              // エラー
              logger.error(err.message);
            }
          }
        });
      })
    );

    // 通知送付
    event.sender.send('operation_finish', 'broadcast');

    // 成功なしなら未完
    if (successCounter == 0) {
      doneFlg = 0;

    } else {
      doneFlg = 1;
    }

    // 対象データ
    const uploadBroadcastArgs: updateargs = {
      table: 'broadcast', // テーブル
      setcol: ['success', 'fail', 'done'], // 更新カラム
      setval: [successCounter, failCounter, doneFlg], // 更新値
      selcol: ['id'], // 対象ID
      selval: [targetBroadcastId], // 対象ID値
    }
    // DBアップデート
    const broadcastDel: any = await myDB.updateDB(uploadBroadcastArgs);

    // エラー
    if (broadcastDel !== 'error') {
      // 更新メッセージ
      logger.debug(`ID:${targetBroadcastId} updated`);
    }
    // CSV出力
    // 現在時刻
    const nowtime: string = `${dir_desktop}\\${(new Date).toISOString().replace(/[^\d]/g, '').slice(0, 14)}`;
    // CSVファイル名
    const targetpath: string = `${nowtime}.csv`;
    // CSV書き出し
    await makeCsvData(resultArray, targetpath);
    // 値返し
    logger.debug('line regstration success');
    // メッセージ表示
    showmessage('info', '配信が完了しました。\nデスクトップに配信結果が保存されます。');

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

/* 履歴 */
// 履歴変更
ipcMain.on('changehistory', async (event: any, arg: any) => {
  try {
    // モード
    logger.debug('ipc: change history mode');
    // 開始位置
    let startPosition: number;
    // 受領データ
    const page: number = arg.page; // 件数
    const direction: string = arg.direction; // 方向

    // 進行方向
    if (direction == 'prev') {
      // 前へ
      startPosition = page - PAGECOUNT + 1;

    } else if (direction == 'forward') {
      // 次へ
      startPosition = PAGECOUNT + page + 1;

    } else {
      // 開始地点
      startPosition = 1;
    }

    // 履歴取得
    const resultArray: historyObj = await gethistory(page, PAGECOUNT);

    // 送信
    event.sender.send('history_finish', {
      start: startPosition, // 開始位置
      total: resultArray.total, // 合計金額
      result: resultArray.result, // 結果
    });

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

/* 汎用 */
// 終了
ipcMain.on('exit', (event, _) => {
  try {
    logger.debug('ipc: exit mode');
    // apple以外
    if (process.platform !== 'darwin') {
      // 終了
      app.quit();
      // falseを返す
      event.returnValue = false;
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// メッセージ表示
ipcMain.on('showmessage', (_: any, arg: any) => {
  try {
    // モード
    logger.debug('ipc: showmessage mode');
    // メッセージ表示
    showmessage(arg.type, arg.message);

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

// エラー
ipcMain.on('error', async (_, arg) => {
  try {
    // エラー処理
    logger.error(arg);
    // エラーメッセージ
    showmessage('error', arg);

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
});

/*
 汎用関数
*/
/* 登録系 */
// 画像登録
const registImage = async (planid: number, imgurls: string | string[], imgWidth?: number, imgHeight?: number): Promise<void> => {
  return new Promise(async (resolve1, reject1) => {
    try {
      logger.debug('module: registImage mode');

      // 配列の時はループ
      if (Array.isArray(imgurls)) {
        // プランテキスト登録
        Promise.all(imgurls.map(async (img: string): Promise<void> => {
          return new Promise(async (resolve2, reject2) => {
            try {
              // プラン画像カラム
              const planImgColumns: string[] = [
                'plan_id', // プランID
                'planimgurl', // プラン画像URL
                'imgwidth', // プラン画像幅
                'imgheight', // プラン画像高
                'usable', // 利用可能
              ];
              // プラン対象値
              const planImgValues: any[] = [
                planid, // プランID
                img, // プラン画像URL
                imgWidth, // プラン画像幅
                imgHeight, // プラン画像高
                1, // 利用可能
              ];
              // 対象データ
              const insertPlanImgArgs: insertargs = {
                table: 'planimg', // テーブル
                columns: planImgColumns, // プラン画像カラム
                values: planImgValues, // プラン対象値
              }
              // プラン画像DB格納
              const tmpPlanImgReg: any = await myDB.insertDB(insertPlanImgArgs);

              // プラン登録失敗
              if (tmpPlanImgReg == 'error') {
                logger.error('プラン画像登録に失敗しました');
                // エラー
                reject2();

              } else {
                logger.debug('planimg registered');
                // 完了
                resolve2();
              }

            } catch (err: unknown) {
              // エラー型
              if (err instanceof Error) {
                // エラー
                logger.error(err.message);
              }
            }
          })
        })).then(() => resolve1());

      } else {
        // プラン画像カラム
        const planImgColumns: string[] = [
          'plan_id', // プランID
          'planimgurl', // プラン画像URL
          'imgwidth', // プラン画像幅
          'imgheight', // プラン画像高
          'usable', // 利用可能
        ];
        // プラン対象値
        const planImgValues: any[] = [
          planid, // プランID
          imgurls, // プラン画像URL
          imgWidth, // プラン画像幅
          imgHeight, // プラン画像高
          1, // 利用可能
        ];
        // 対象データ
        const insertPlanImgArgs: insertargs = {
          table: 'planimg', // テーブル
          columns: planImgColumns, // 画像カラム
          values: planImgValues, // 対象値
        }
        // プラン画像DB格納
        const tmpPlanImgReg: any = await myDB.insertDB(insertPlanImgArgs);

        // プラン登録失敗
        if (tmpPlanImgReg == 'error') {
          logger.error('プラン画像登録に失敗しました');
          // エラー
          reject1();

        } else {
          logger.debug('planimg registered');
          // 完了
          resolve1();
        }
      }

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
      }
    }
  });
}

// プランテキスト登録
const registTxt = async (planid: number, plantxts: any[]): Promise<void> => {
  return new Promise(async (resolve1, reject1) => {
    try {
      logger.debug('module: registtext mode');

      // プランテキスト登録
      Promise.all(plantxts.map(async (txt: any): Promise<void> => {
        return new Promise(async (resolve2, reject2) => {
          try {
            // プランテキスト対象カラム
            const planTxtColumns: string[] = [
              'plan_id', // プランID
              'plantxt', // プラン名
              'url', // url
              'usable', // 使用可能
            ];
            // プランテキスト対象値
            const planTxtValues: any[] = [
              planid,
              sanitizeHtml(txt.txt),
              sanitizeHtml(txt.url),
              1,
            ];
            // 対象データ
            const insertplanTxtArgs: insertargs = {
              table: 'plantxt', // テーブル
              columns: planTxtColumns, // 対象カラム
              values: planTxtValues, // 対象値
            }
            // トランザクションDB格納
            const tmpPlanTxtReg: any = await myDB.insertDB(insertplanTxtArgs);

            // プランテキスト登録失敗
            if (tmpPlanTxtReg == 'error') {
              logger.error('プランテキスト登録に失敗しました');
              throw new Error('plantxt register error');

            } else {
              logger.debug('plantxt registered');
              // 完了
              resolve2();
              // 1秒待機
              await setTimeout(1000);
            }

          } catch (err: unknown) {
            // エラー型
            if (err instanceof Error) {
              // エラー
              logger.error(err.message);
              // エラー
              reject2();
            }
          }
        })
      })).then(() => resolve1());

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
        // エラー
        reject1();
      }
    }
  });
}

/* 取得系 */
// 履歴取得
const gethistory = async (offset: number, limit: number): Promise<any> => {
  return new Promise(async (resolve, _) => {
    try {
      logger.debug('module: gethistory mode');
      // count arguments
      const bdcountargs: countargs = {
        table: 'broadcast', // テーブル
        columns: [], // 対象カラム
        values: [], // 対象値
      }
      // 対象件数
      const ebisudoUserCount: number = await myDB.countDB(bdcountargs);
      // 対象データ
      const broadcastSelectArgs: selectargs = {
        table: 'broadcast', // テーブル
        columns: [], // カラム
        values: [], // 値
        limit: limit, // 上限
        offset: offset, // オフセット
        order: 'id', // id
        reverse: false, // 反転
        fields: ['broadcast.id', 'broadcastname', 'plan_id', 'channel_id', 'sendtime', 'success', 'fail', 'done'], // 選択カラム
      }
      // 配信履歴抽出
      const broadcastData: any = await myDB.selectDB(broadcastSelectArgs);
      // エラー
      if (broadcastData === 'error') {
        throw new Error('broadcast select error');

      } else {
        logger.debug('sql: broadcast select success');
      }

      // 結果オブジェクト化
      const resultObjects: any = JSON.parse(JSON.stringify(broadcastData));

      // 履歴オブジェクト
      const historyObj: any = {
        total: String(ebisudoUserCount), // データ総数
        result: resultObjects, // データ
      }
      // 結果
      resolve(historyObj);

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
      }
    }
  });
}

/* ツール系 */
// Lineメッセージ
const sendLineMessage = (uid: string, title: string, linemethodno: number, contentTexts: string[], linkurls: string[], imgurls: string[], token: string, width: number, height: number): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('module: sendLineMessage mode');
      // 選択肢(URL)
      let defaultActions: any = {};

      // データあり
      if (uid) {
        logger.debug('func: makeMessage mode');
        // 配信内容
        let dataString: string = '';

        // 配信内容により条件分岐
        switch (linemethodno) {
          // テキスト
          case 1:
            logger.debug('1: text mode');
            // 配信内容
            dataString = JSON.stringify({
              to: uid, // 返信トークン
              messages: [
                {
                  'type': 'text', // テキスト
                  'text': contentTexts[0], // 本文
                }
              ],
            });
            break;

          // 画像
          case 2:
            logger.debug('2: image mode');
            // 配信内容
            dataString = JSON.stringify({
              to: uid, // 返信トークン
              messages: [
                {
                  type: 'flex', // flex
                  altText: title, // 代替タイトル
                  contents: {
                    type: 'bubble', // 吹き出し
                    size: 'giga', // フルサイズ
                    hero: {
                      type: 'image', // 画像
                      url: imgurls[0], // 画像url
                      size: 'full', // フル
                      aspectRatio: `${width}:${height}`, // 画像縦横比
                    }
                  }
                }
              ],
            });
            break;

          // 選択肢
          case 3:
          case 4:
            logger.debug('3/4: button mode');
            // 送信用
            let actions: any[] = [];
            // 選択肢モード
            if (linemethodno == 3) {
              // 選択肢(URL)
              defaultActions = {
                type: "uri", // URIモード
                label: title, // 選択肢ラベル
                uri: linkurls[0], // リンク
              };
              // アクション作成
              for (let i = 0; i < contentTexts.length; i++) {
                actions.push({
                  type: "uri", // URIモード
                  label: contentTexts[i], // 選択肢ラベル
                  uri: linkurls[i], // リンク
                });
              }

            } else if (linemethodno == 4) {
              // 選択肢(MSG)
              defaultActions = {
                type: "message", // メッセージモード
                label: title, // タイトル
                text: 'hoge', // メッセージ
              };
              // アクション作成
              for (let i = 0; i < contentTexts.length; i++) {
                actions.push({
                  type: "message", // メッセージモード
                  label: contentTexts[i], // ラベル
                  text: linkurls[i], // リンク
                });
              }
            }

            console.log(defaultActions);

            // 配信内容
            dataString = JSON.stringify({
              to: uid, // 返信トークン
              messages: [{
                type: 'template', // テンプレート
                altText: title, // タイトル
                template: {
                  type: 'buttons', // 選択肢
                  thumbnailImageUrl: imgurls[0], // 画像サムネイルURL
                  imageAspectRatio: 'rectangle', // 画像縦横比
                  imageSize: 'cover', // 表示形式
                  text: title, // タイトル
                  defaultAction: defaultActions, // 選択肢(URL)
                  actions: actions, // 標準アクション
                }
              }]
            });

            break;

          /*
          // カルーセル
          case 5:
            logger.debug('5: image_carousel mode');
            // 送信用
            let carouselactions: carouseltemplateobj[] = [];

            // アクション作成
            for (let i = 0; i < contentTexts.length; i++) {
              carouselactions.push({
                imageUrl: imgurls[0], // 画像URL
                action: {
                  type: 'uri', // URIモード
                  label: contentTexts[i], // ラベル
                  uri: linkurls[i], // URI
                }
              });
            }
            // 配信内容
            dataString = JSON.stringify({
              to: uid, // 返信トークン
              messages: [{
                type: 'template', // テンプレート
                altText: title, // タイトル
                template: {
                  type: 'image_carousel', // カルーセル
                  columns: carouselactions, // 標準アクション
                }
              }]
            });
            break;
          */

          default:
            // 配信内容
            dataString = '';
            logger.debug(`Sorry, we are out of ${linemethodno}.`);
        }

        logger.debug('func: makeBroadcast mode');
        // ヘッダ
        const headers: any = {
          'Content-Type': 'application/json', // Content-type
          Authorization: 'Bearer ' + token, // 認証トークン
        };

        // WEBHOOKオプション
        const webhookOptions: any = {
          hostname: 'api.line.me', // ホスト名
          path: '/v2/bot/message/push', // 送信パス
          method: 'POST', // 認証方式
          headers: headers, // ヘッダ
          body: dataString, // data
        }

        // リクエスト
        const request: any = https.request(webhookOptions, res => {
          res.on('data', (chunk: any) => {

            // 成功数/失敗数取得
            if (JSON.parse(chunk).sentMessages) {
              logger.debug('data send success.');
              // 成功
              resolve('〇');

            } else {
              logger.debug('data send failed.');
              // 失敗
              resolve('×');
            }
          });
        });
        // データ送信
        request.write(dataString);

        // 送信エラー
        request.on('error', (error: unknown) => {
          // エラー型
          if (error instanceof Error) {
            // エラー
            logger.error(error.message);
          }
        });
        // コネクションクローズ
        request.end();
      }

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
        reject();
      }
    }
  });
}

// ファイルアップロード
const uploadFile = async (localpath: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('module: uploadFile mode');
      // アップロード先ファイルパス
      const uploadPath: string = `/home/ebisuan/www/assets/image/${path.basename(localpath)}`;
      // ポート番号
      const port: number = 22;
      // SFTPホスト名
      const host: string = process.env.SFTP_HOST!;
      // SFTPユーザ名
      const username: string = process.env.SFTP_USER!;
      // SFTPパスワード
      const password: string = process.env.SFTP_PASSWORD!;
      // SFTPクライアント
      const sftpClient: any = new Client();
      // SFTP接続
      await sftpClient.connect({ host, port, username, password });
      // 画像ファイルをアップロード
      await sftpClient.put(localpath, uploadPath);
      // 切断
      await sftpClient.end();
      logger.debug('sftp closed');
      // 完了
      resolve('success');

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
        // エラー
        reject();
      }
    }
  });
}

// 画像ファイル選択
const getImageFile = (flg: boolean): Promise<string | string[]> => {
  return new Promise((resolve, reject) => {
    try {
      logger.debug('module: getImageFile mode');
      // プロパティ
      let fixedProperties: any[] = ['openFile'];

      // 複数選択モード
      if (flg) {
        fixedProperties.push('multiSelections');
      }
      // ファイル選択ダイアログ
      dialog.showOpenDialog({
        properties: fixedProperties, // ファイル
        title: CHOOSE_IMG_FILE, // ファイル選択
        defaultPath: '.', // ルートパス
        filters: [
          { name: 'jpg|png', extensions: ['jpg', 'jpeg', 'png'] } // jpg|pngのみ
        ],

      }).then(async (result) => {
        // ファイルパス
        const filenames: string[] = result.filePaths;

        // ファイルあり
        if (filenames.length > 0) {
          // 値返し
          resolve(filenames);

        } else {
          // ファイルなし
          reject('error');
        }

      }).catch((err: unknown) => {

        // エラー型
        if (err instanceof Error) {
          // エラー
          logger.error(err.message);
        }
      });

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
      }
    }
  });
}

// メッセージ表示
const showmessage = async (type: string, message: string): Promise<void> => {
  try {
    logger.debug('module: showmessage mode');
    // モード
    let tmpType: 'none' | 'info' | 'error' | 'question' | 'warning' | undefined;
    // タイトル
    let tmpTitle: string | undefined;

    // urlセット
    switch (type) {
      // 通常モード
      case 'info':
        tmpType = 'info';
        tmpTitle = '情報';
        // エラー
        logger.debug(message);
        break;

      // エラーモード
      case 'error':
        tmpType = 'error';
        tmpTitle = 'エラー';
        // エラー
        logger.error(message);
        break;

      // 警告モード
      case 'warning':
        tmpType = 'warning';
        tmpTitle = '警告';
        // エラー
        logger.error(message);
        break;

      // それ以外
      default:
        tmpType = 'none';
        tmpTitle = '';
    }

    // オプション
    const options: Electron.MessageBoxOptions = {
      type: tmpType, // タイプ
      message: tmpTitle, // メッセージタイトル
      detail: message,  // 説明文
    }
    // ダイアログ表示
    dialog.showMessageBox(options);

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラーメッセージ
      logger.error(e.message);
    }
  }
}

// 日付変換関数
const formatDateInYyyymmdd = (date: Date) => {
  const y = date.getFullYear();
  const mh = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  const yyyy = y.toString();
  const mhmh = ('00' + mh).slice(-2);
  const dd = ('00' + d).slice(-2);
  const hh = ('00' + h).slice(-2);
  const mm = ('00' + m).slice(-2);
  const ss = ('00' + s).slice(-2);

  return `${yyyy}-${mhmh}-${dd} ${hh}:${mm}:${ss}`;
}

/* CSV系 */
// CSV抽出
const getCsvData = (): Promise<recordType | string> => {
  return new Promise((resolve, reject) => {
    try {
      logger.debug('module: getCsvData mode');
      // ファイル選択ダイアログ
      dialog.showOpenDialog({
        properties: ['openFile'], // ファイル
        title: CHOOSE_CSV_FILE, // ファイル選択
        defaultPath: '.', // ルートパス
        filters: [
          { name: 'csv(Shif-JIS)', extensions: ['csv'] }, // csvのみ
        ],

      }).then(async (result) => {
        // ファイルパス
        const filenames: string[] = result.filePaths;
        // エラー
        logger.debug(`you got csv named ${filenames[0]}.`);

        // ファイルあり
        if (filenames.length) {
          // ファイル読み込み
          const data: any = await readFile(filenames[0]);
          // デコード
          const str: string = iconv.decode(data, CSV_ENCODING);
          // csvパース
          const tmpRecords: string[][] = parse(str, {
            columns: false, // カラム設定なし
            from_line: 2, // 開始行無視
            skip_empty_lines: true, // 空白セル無視
          });
          logger.debug(`you got csv named ${data}`);
          // 値返し
          resolve({
            record: tmpRecords, // データ
            filename: filenames[0], // ファイル名
          });

          // ファイルなし
        } else {
          // エラー
          reject(result.canceled);
        }
      });

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
      }
    }
  });
}

// CSV抽出
const makeCsvData = (arr: any[], filename: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('module: makeCsvData mode');
      // csvdata
      const csvData: any = stringify(arr, { header: true });
      // 書き出し
      await writeFile(filename, iconv.encode(csvData, 'shift_jis'));
      // 完了
      resolve();

    } catch (e: unknown) {

      // エラー型
      if (e instanceof Error) {
        // エラーメッセージ
        logger.error(e.message);
        // エラー
        reject();
      }
    }
  });
}