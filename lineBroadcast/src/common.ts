/**
 * common.ts
 **
 * function：LINE配信用 アプリ
**/

// カウンタ
let nodecounter: number = 0;

// チャンネル名
const channelnameDom: any = document.getElementById('channelname');
// チャンネル選択
const channelselectDom: any = document.getElementById('channel-select');
// トークン
const tokenDom: any = document.getElementById('token');
// 配信名
const broadcastnameDom: any = document.getElementById('broadcastname');
// CSVファイル
const csvfileDom: any = document.getElementById('csvfilepath');
// プラン名
const plannameDom: any = document.getElementById('planname');
// プラン選択
const planselectDom: any = document.getElementById('plan-select');
// 配信タイプ
const linemethodselectDom: any = document.getElementById('linemethod-select');
// ジャンル名
const genrenameDom: any = document.getElementById('genrename');
// ジャンル選択
const genreselectDom: any = document.getElementById('genre-select');
// 編集エリア
const editAreaDom: any = document.getElementById('editarea');
// 単一画像選択ボタン
const imageSingleDom: any = document.getElementById('single');
// 複数画像選択ボタン
const imageMultipleDom: any = document.getElementById('multiple');
// クリアボタン
const imageClearDom: any = document.getElementById('clear');
// 表示テキスト
const textAreaDom: any = document.getElementById('textarea');
// 遷移先URL
const urlAreaDom: any = document.getElementById('urlarea');
// 標準遷移先
const defaultTransferAreaDom: any = document.getElementById('defaulturl');
// 標準遷移先ヘッダ
const defaultTransferHeadDom: any = document.getElementById('defaulturlhead');
// ボタン登録エリア
const buttonAreaDom: any = document.getElementById('regbtn');
// 追加ボタン
const addButtonAreaDom: any = document.getElementById('addText');
// 標準遷移先URL
const baseurlDom: any = document.getElementById('baseurl');
// フォームクリアボタン
const clearformAreaDom: any = document.getElementById('clearform');
// 単一画像URL
const singleImageDom: any = document.getElementById('imagepath');
// 複数画像URL
const multiImageElements: any = document.getElementsByClassName('multiImagepath');
// 遷移先URL
const displayurlElements: any = document.getElementsByClassName('displayurl');
// 表示テキスト
const displayheadElements: any = document.getElementsByClassName('displayhead');

// 登録完了
(window as any).api.on('operation_finish', (arg: any) => {
  try {
    switch (arg) {
      // 配信
      case 'broadcast':
        // フォーム初期化
        channelnameDom.value = "";
        channelselectDom.options[0].selected = true;
        broadcastnameDom.value = '';
        csvfileDom.innerHTML = '';
        channelselectDom.options[0].selected = true;
        planselectDom.options[0].selected = true;
        break;

      // プラン
      case 'plan':
        // フォーム初期化
        plannameDom.value = '';
        genreselectDom.options[0].selected = true;
        linemethodselectDom.options[0].selected = true;
        planselectDom.options[0].selected = true;
        break;

      // チャンネル
      case 'channel':
        // フォーム初期化
        channelnameDom.value = "";
        channelselectDom.options[0].selected = true;
        break;

      // ジャンル
      case 'genre':
        // フォーム初期化
        genrenameDom.value = "";
        genreselectDom.options[0].selected = true;
        break;

      default:
        console.log(`Sorry, we are out of ${arg}.`);
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// ジャンル
(window as any).api.on('genreMasterlist', (arg: any) => {
  try {
    // エラー
    if (arg != 'error') {
      // ジャンル自動生成
      arg.forEach((obj: any) => {
        // オプションタグ生成
        const option: any = document.createElement('option');
        // 値代入
        option.value = String(obj.id);
        // ジャンル代入
        option.textContent = obj.genrename;
        // セレクトに追加
        genreselectDom.appendChild(option);
      });

    } else {
      console.log('error');
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// 配信方法
(window as any).api.on('lineMethodMasterlist', (arg: any) => {
  try {
    // エラー
    if (arg != 'error') {
      // ジャンル自動生成
      arg.forEach((obj: any) => {
        // オプションタグ生成
        const option: any = document.createElement('option');
        // 値代入
        option.value = String(obj.id);
        // ジャンル代入
        option.textContent = obj.linemethodname;
        // セレクトに追加
        linemethodselectDom.appendChild(option);
      });

    } else {
      console.log('error');
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// プラン
(window as any).api.on('planMasterllist', (arg: any) => {
  try {
    // エラー
    if (arg != 'error') {
      // プラン自動生成
      arg.forEach((obj: any) => {
        // オプションタグ生成
        const option: any = document.createElement('option');
        // 値代入
        option.value = String(obj.id);
        // 表示名
        option.textContent = `${obj.id}: ${obj.planname}`;
        // セレクトに追加
        planselectDom.appendChild(option)
      });

    } else {
      console.log('error');
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// チャンネル
(window as any).api.on("channelMasterllist", (arg: any) => {
  try {
    // エラー
    if (arg != 'error') {
      // チャンネル自動生成
      arg.forEach((obj: any) => {
        // オプションタグ生成
        const option: any = document.createElement('option');
        // 値代入
        option.value = String(obj.id);
        // 表示名
        option.textContent = `${obj.id}: ${obj.channelname}`;
        // セレクトに追加
        channelselectDom.appendChild(option)
      });

    } else {
      console.log('error');
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// ユーザ
(window as any).api.on('usersCsvlist', (arg: any) => {
  try {
    // エラー
    if (arg != 'error') {
      // ユーザ一覧
      const userArray: any[] = arg.record;
      // JSON文字列変換
      const serializedArray: any = JSON.stringify(userArray);
      // localStorage保存
      localStorage.setItem('userArray', serializedArray);
      // ファイルパス表示
      csvfileDom.innerHTML = arg.filename;

    } else {
      console.log('error');
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// 画像ファイルパス
(window as any).api.on('image', (arg: any) => {
  try {
    // 選択配信タイプ
    const linemethod: number = linemethodselectDom.value;
    // localStorageクリア
    localStorage.clear();
    // localStorage保存
    localStorage.setItem('imageArray', arg.allpath);

    // カルーセルだけ実行
    if (linemethod == 5) {
      // 画像パス書き換え
      for (let i = 0; i < multiImageElements.length; i++) {
        multiImageElements[i].innerHTML = arg.allpath[i];
      }

    } else {
      // パス
      singleImageDom.innerHTML = arg.path;
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// データなし
(window as any).api.on('notexists', (arg: any) => {
  try {
    // メッセージオプション
    const messageOption: messageobj = {
      title: 'エラー', // メッセージタイトル
      message: arg, // メッセージ本体
      type: 'fatal', // 警告
    };
    // ポップアップ表示
    (window as any).api.send('showmessage', messageOption);
    // 戻る
    history.back();

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
});

// ※汎用
// アップロード
const upload = (flg: boolean): void => {
  try {
    // 配信モード
    (window as any).api.send('upload', flg);

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// アップロードクリア
const clearUpload = (): void => {
  try {
    // 全対象要素
    for (let i = 0; i < multiImageElements.length; i++) {
      // 画像パスクリア
      multiImageElements[i].innerHTML = '';
    }
    // 画像パスクリア
    singleImageDom.innerHTML = '';

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// CSVモード
const readCSV = (): void => {
  try {
    // CSVモード
    (window as any).api.send('csv');

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// CSVクリアモード
const clearCSV = (): void => {
  try {
    // localStorageクリア
    localStorage.clear();
    // ファイルパス表示
    csvfileDom.innerHTML = '';

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// 即時配信モード
const broadcast = (): void => {
  try {
    // 配信名
    let broadcastname: string = broadcastnameDom.value;
    // エラーフラグ
    let errorflg: boolean = false;
    // エラーメッセージ
    let errorArray: string[] = [];
    // ユーザ一覧
    let userArray: any;
    // ローカルストレージ
    const serializedArray: any = localStorage.getItem('userArray');
    // 選択チャンネル
    const channel: string = channelselectDom.value;
    // 選択プラン
    const planId: string = planselectDom.value;

    /* バリデーション */
    // 配信名
    if (broadcastname == '') {
      errorArray.push('配信名が空欄です');
      errorflg = true;
    }
    // チャネル
    if (channelselectDom.options[0].selected) {
      errorArray.push('チャネルを選択してください');
      errorflg = true;
    }
    // プラン
    if (planselectDom.options[0].selected) {
      errorArray.push('プランを選択してください');
      errorflg = true;
    }
    // ユーザなし
    if (!serializedArray) {
      errorArray.push('顧客CSVを選択してください');
      errorflg = true;

    } else {
      // JSON文字列変換
      userArray = JSON.parse(serializedArray);
    }

    // エラーなし
    if (!errorflg) {
      // 送付内容
      const broadcastObj: broadcastobj = {
        bdname: broadcastname, // 配信名
        channel: channel, // 選択チャンネル
        plan: planId, // 選択プラン
        users: userArray.map(Number), // ユーザ一覧
      };
      // 配信モード
      (window as any).api.send('broadcast', broadcastObj);

    } else {
      // メッセージオプション
      const messageOption: messageobj = {
        title: 'エラー', // メッセージタイトル
        message: errorArray.join('|'), // メッセージ本体
        type: 'error', // 警告
      };
      // エラー表示
      (window as any).api.send('showmessage', messageOption);
    }

  } catch (e: unknown) {

    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// ※登録
// プラン登録
const planregister = (e: any): void => {
  try {
    // ダブルクリック防止
    e.preventDefault();
    // エラーフラグ
    let errorflg: boolean = false;
    // 配信テキスト
    let tmpTextArray: any[] = [];
    // 配信URL
    let tmpUrlArray: any[] = [];
    // エラーメッセージ
    let errorArray: string[] = [];
    // URLエリア
    const allUrlElements: any = document.getElementsByClassName('planurl');
    // テキストエリア
    const allTextElements: any = document.getElementsByClassName('plantext');
    // ジャンル
    const genre: string = genreselectDom.value ?? '';
    // 画像パス
    const imgPath: string = singleImageDom.innerHTML ?? '';
    // 画像パスリスト
    const imgPathArray: any = localStorage.getItem('imageArray')?.split(',');
    // プラン名
    const planname: string = plannameDom.value ?? '';
    // 標準遷移先URL
    const baseUrl: string = baseurlDom.value ?? '';
    // 選択配信タイプ
    const linemethod: number = linemethodselectDom.value ?? 0;

    // プランテキスト配列
    for (let i = 0; i < allTextElements.length; i++) {
      // プランURL配列作成
      tmpTextArray.push({
        url: allUrlElements.item(i).value,
        txt: allTextElements.item(i).value,
      });
    }

    /* バリデーション */
    // プラン名
    if (planname == '') {
      // エラー追加
      errorArray.push('プラン名が空欄です');
      errorflg = true;
    }
    // ジャンル
    if (genreselectDom.options[0].selected) {
      // エラー追加
      errorArray.push('ジャンルを選択してください');
      errorflg = true;
    }
    // 配信タイプ
    if (linemethodselectDom.options[0].selected) {
      // エラー追加
      errorArray.push('配信タイプを選択してください');
      errorflg = true;
    }

    // 画像モード以外
    if (linemethod != 2) {
      // テキスト
      if (tmpTextArray[0] == '') {
        // エラー追加
        errorArray.push('テキストが空欄です');
        errorflg = true;
      }
    }

    // カルーセルモード
    /*if (linemethod == 5) {
      // 画像なし
      if (imgPathArray.length == 0) {
        // エラー追加
        errorArray.push('画像が未選択です');
        errorflg = true;
      }
    }
    */

    if (linemethod != 1) {
      // 画像なし
      if (imgPath == '') {
        // エラー追加
        errorArray.push('画像が未選択です');
        errorflg = true;
      }
    }

    // エラーなし
    if (!errorflg) {
      // 送付内容
      const sendObj: plansendobj = {
        planname: planname, // プラン名
        linemethod: linemethod, // 配信形式
        baseurl: baseUrl, // 標準URL
        textSet: tmpTextArray, // 対象文字列
        genre: genre, // ジャンル
        imagepath: imgPath, // 画像パス
        imagedata: imgPathArray // 画像パス集
      };
      // 送付対象
      const finalSendObj = JSON.parse(JSON.stringify(sendObj));
      // 配信モード
      (window as any).api.send('planregister', finalSendObj);

    } else {
      // メッセージオプション
      const messageOption: messageobj = {
        title: 'エラー', // メッセージタイトル
        message: errorArray.join('|'), // メッセージ
        type: 'error', // エラー
      };
      // エラー表示
      (window as any).api.send('showmessage', messageOption);
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// チャンネル登録
const channelregister = (): void => {
  try {
    // チャンネル名
    let channelname: string;
    // トークン
    let token: string;
    // エラーフラグ
    let errorflg: boolean = false;
    // エラーメッセージ
    let errorArray: string[] = [];
    // チャンネル名
    channelname = channelnameDom.value;
    // トークン
    token = tokenDom.value;

    /* バリデーション */
    // チャンネル名
    if (channelname == "") {
      // エラー追加
      errorArray.push("チャンネル名が空欄です");
      errorflg = true;
    }
    // トークン
    if (token == "") {
      // エラー追加
      errorArray.push("トークンが空欄です");
      errorflg = true;
    }

    // エラーなし
    if (!errorflg) {
      // 送付内容
      const sendObj: channelsendobj = {
        channelname: channelname, // チャンネル名
        token: token, // トークン
      };
      // 配信モード
      (window as any).api.send("channelregist", sendObj);

    } else {
      // メッセージ送付
      (window as any).api.send("error", errorArray.join("|"));
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// ジャンル登録
const genreregister = (): void => {
  try {
    // ジャンル名
    let genrename: string;
    // エラーフラグ
    let errorflg: boolean = false;
    // エラーメッセージ
    let errorArray: string[] = [];
    // ジャンル名(再取得)
    genrename = genrenameDom.value;

    /* バリデーション */
    // ジャンル名
    if (genrename == "") {
      // エラーメッセージ
      errorArray.push("ジャンル名が空欄です");
      errorflg = true;
    }

    // エラーなし
    if (!errorflg) {
      // 配信モード
      (window as any).api.send("genreregister", genrename);

    } else {
      // メッセージオプション
      const messageOption: messageobj = {
        title: "エラー", // タイトル
        message: errorArray.join("|"), // メッセージ
        type: "error", // エラー
      };
      // メッセージ送付
      (window as any).api.send("showmessage", messageOption);
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// 削除
const deleteit = (table: string): void => {
  try {
    // 変数定義
    // インデックス
    let tableIdx: number = 0;
    // ID
    let tableid: string = '';
    // オプション
    let tableoption: string = '';

    switch (table) {
      // プラン
      case 'plan':
        // 選択インデックス
        tableIdx = planselectDom.selectedIndex;
        // 値
        tableid = planselectDom.options[tableIdx].value;
        // オプション値
        tableoption = planselectDom.options[tableIdx].innerHTML;
        break;

      // チャンネル
      case 'channel':
        // 選択インデックス
        tableIdx = channelselectDom.selectedIndex;
        // 値
        tableid = channelselectDom.options[tableIdx].value;
        // オプション値
        tableoption = channelselectDom.options[tableIdx].innerHTML;
        break;

      // ジャンル
      case 'genre':
        // 選択インデックス
        tableIdx = genreselectDom.selectedIndex;
        // 値
        tableid = genreselectDom.options[tableIdx].value;
        // オプション値
        tableoption = genreselectDom.options[tableIdx].innerHTML;
        break;

      // デフォルト
      default:
        console.log(`Sorry, we are out of ${table}.`);
    }

    // 送付内容
    const sendObj: deletesendobj = {
      table: table, // テーブル
      id: tableid, // ID
      name: tableoption, // 名前
    };
    // 削除モード
    (window as any).api.send("delete", sendObj);

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// 追加ボタン
const addButton = (): void => {
  try {
    // 上限
    let nodeLimit: number = 0;
    // URLエリア
    const allUrlElements: any = document.getElementsByClassName('.planurl');
    // テキストエリア
    const allTextElements: any = document.getElementsByClassName('.plantext');
    // 選択配信タイプ
    const linemethod: number = linemethodselectDom.value;
    // 画像リスト
    const imgPathArray: any = localStorage.getItem('imageArray')?.split(',');
    // カウントアップ
    nodecounter++;

    // 配信モードにより上限変動
    if (linemethod == 3 || linemethod == 4) {
      // 選択肢
      nodeLimit = 3;

      /*
    } else if (linemethod == 5) {
        // カルーセル
        nodeLimit = 9;
  
        // 上限超え
        if (nodecounter > imgPathArray.length - 1) {
          // ジャンル一覧返し
          throw new Error('画像数を超えています。画像を再度読み込んでください。');
        }
  */
    } else {
      // 無限
      nodeLimit = 999;
    }

    // 上限超え
    if (nodecounter > nodeLimit) {
      // ジャンル一覧返し
      throw new Error('上限を超えています。');
    }

    // 最初の要素
    const firstTextElement: any = document.getElementsByClassName('displaytextarea');
    // 要素の長さ
    const length: number = firstTextElement.length - 1;
    // 複製対象
    const cloneElement: any = firstTextElement[length].cloneNode(true);
    // 複製
    firstTextElement[length].after(cloneElement);

    // ラベル書き換え
    Array.from(displayurlElements).forEach((target: any, idx: number) => {

      // 配信方式で変更
      if (linemethod == 3) {
        // 選択肢モードURL
        target.innerHTML = `遷移先URL${idx + 1}`;
        // 標準遷移先
        baseurlDom.value = '標準遷移先URL';

      } else if (linemethod == 4) {
        // 選択肢モードテキスト
        target.innerHTML = `表示メッセージ${idx + 1}`;
        // 標準遷移先
        baseurlDom.value = 'メッセージ';
      }
    });

    // 全要素対象
    Array.from(displayheadElements).forEach((target: any, idx: number) => {
      // ラベル書き換え
      target.innerHTML = `表示テキスト${idx + 1}`;
    });

    /*
    // カルーセルだけ実行
    if (linemethod == 5) {
      // 全画像パス対象
      for (let i = 0; i < imgPathArray.length; i++) {
        // 画像パス書き換え
        multiImageElements[i].innerHTML = imgPathArray[i];
      }
    }
    */
    // ID付与
    cloneElement.id = `content_area${nodecounter + 1}`;

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// クリアフォーム
const clearform = (): void => {
  try {
    // クリア対象要素
    const Elements: any = document.getElementsByClassName('displaytextarea');
    // テキストエリア
    const allTextElements: any = document.getElementsByClassName('plantext')[0];
    // URLエリア
    const allUrlElements: any = document.getElementsByClassName('planurl')[0];

    // 全要素クリア
    while (Elements.length - 1) {
      // 一つになるまで削除
      Elements.item(1).remove();
    }

    // 標準遷移先URLクリア
    baseurlDom.value = '';
    // 表示テキストクリア
    allTextElements.value = '';
    // 遷移先URLクリア
    allUrlElements.value = '';

    // カウンタリセット
    nodecounter = 0;

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// セレクトボックス変更
const linemethodchange = (obj: any): void => {
  try {
    // 選択インデックス
    const idx: number = obj.selectedIndex;
    // 値
    const value: string = obj.options[idx].value;
    // URLエリア
    const allUrlElements: any = document.getElementsByClassName('.planurl');

    // スタイル変更
    editAreaDom.style.display = 'block';
    buttonAreaDom.style.display = 'flex';
    multiImageElements.innerHTML = '';
    // フォーム
    clearform();
    // アップロード
    clearUpload();

    // 値とテキストをコンソールに出力
    switch (value) {
      // テキストモード
      case '1':
        imageSingleDom.style.display = 'none';
        imageMultipleDom.style.display = 'none';
        imageClearDom.style.display = 'none';
        textAreaDom.style.display = 'block';
        addButtonAreaDom.style.display = 'none';
        urlAreaDom.style.display = 'none';
        clearformAreaDom.style.display = 'none';
        defaultTransferAreaDom.style.display = 'none';
        singleImageDom.style.display = 'none';
        break;

      // 画像モード
      case '2':
        imageSingleDom.style.display = 'block';
        imageMultipleDom.style.display = 'none';
        imageClearDom.style.display = 'block';
        textAreaDom.style.display = 'none';
        addButtonAreaDom.style.display = 'none';
        urlAreaDom.style.display = 'none';
        clearformAreaDom.style.display = 'none';
        defaultTransferAreaDom.style.display = 'none';
        singleImageDom.style.display = 'block';
        break;

      // 選択肢モード
      case '3':
      case '4':
        imageSingleDom.style.display = 'block';
        imageMultipleDom.style.display = 'none';
        imageClearDom.style.display = 'block';
        textAreaDom.style.display = 'block';
        addButtonAreaDom.style.display = 'block';
        urlAreaDom.style.display = 'block';
        clearformAreaDom.style.display = 'block';
        defaultTransferAreaDom.style.display = 'block';
        singleImageDom.style.display = 'block';

        // 表示書き換え
        Array.from(displayurlElements).forEach((target: any) => {

          // 配信方式で変更
          if (value == '3') {
            // 選択肢モード
            target.innerHTML = "遷移先URL";
            defaultTransferHeadDom.innerHTML = '標準遷移先URL';

          } else if (value == '4') {
            // カルーセルモード
            target.innerHTML = "表示メッセージ";
            defaultTransferHeadDom.innerHTML = '通常メッセージ';
          }
        });

        // プレースホルダー書き換え
        Array.from(allUrlElements).forEach((target: any) => {

          // 配信方式で変更
          if (value == '3') {
            // 選択肢モード
            target.placeholder = "遷移先URL";

          } else if (value == '4') {
            // カルーセルモード
            target.placeholder = "表示メッセージ";
          }
        });
        break;

      // カルーセルモード
      /*
      case '5':
        imageSingleDom.style.display = 'none';
        imageMultipleDom.style.display = 'block';
        imageClearDom.style.display = 'block';
        textAreaDom.style.display = 'block';
        addButtonAreaDom.style.display = 'block';
        urlAreaDom.style.display = 'block';
        clearformAreaDom.style.display = 'block';
        defaultTransferAreaDom.style.display = 'none';
        singleImageDom.style.display = 'none';
        break;
      */

      default:
        console.log(`Sorry, we are out of ${value}.`);
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// ページ遷移
const transfer = (channel: string): void => {
  try {
    // 配信ページ遷移
    (window as any).api.send("page", channel);

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}

// アプリ終了
const exitApp = (): void => {
  try {
    // アプリ終了
    (window as any).api.send("exit", '');

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      // エラー処理
      //(window as any).api.send('error', e.message);
    }
  }
}