/**
 * globalobjs.d.ts
 **
 * function：グローバル宣言
**/

export { };

declare global {

  // レコード型
  type recordType = {
    record: string[][]; // CSVデータ
    filename: string; // ファイル名
  };
  // 送付結果CSV情報
  interface csvobj {
    ID: string;
    配信ID: string;
    顧客番号: string;
    ユーザID: string;
    結果: string;
  };
  // 履歴情報
  interface historyObj {
    start: number;
    total: string;
    result: any;
  };
  // 画像情報
  interface imageInfObj {
    url: string;
    width: number;
    height: number;
  };
  // メッセージ情報
  interface messageobj {
    title: string; // 配信名
    message: string; // 選択チャンネル
    type: string; // 選択プラン
  };
  // 送付結果情報
  interface broadcastobj {
    bdname: string; // 配信名
    channel: string; // 選択チャンネル
    plan: string; // 選択プラン
    users: any; // ユーザ一覧
  };
  // プラン用
  interface plansendobj {
    planname: string; // プラン名
    linemethod: number; // 配信方法
    baseurl: string; // 標準遷移先URL
    textSet: any[]; // 配信テキスト集
    genre: string; // 配信ジャンル
    imagepath: string; // 画像URL
    imagedata: string[]; // 画像URLリスト
  };
  // 配信用
  interface bdmessageobj {
    contentTexts: string[]; // 配信テキスト集
    linkurls: string[]; // URL集
    imgurls: string[]; // URL集
    width: number; // 画像幅
    height: number; // 画像高さ
  };
  // ボタンアクション用
  interface buttonactionobj {
    type: string; // タイプ
    label: string; // ラベル
    uri: string; // URL
  };
  // カルーセルテンプレート用
  interface carouseltemplateobj {
    imageUrl: string; // 画像URL
    action: carouselactionobj; // カルーセルアクション
  };
  // uriアクション用
  interface uriactionobj {
    type: string; // タイプ
    label: string; // ラベル
    uri: string; // データ
  };
  // msgアクション用
  interface msgactionobj {
    type: string; // タイプ
    label: string; // ラベル
    message: string; // データ
  };
  // チャンネル用
  interface channelsendobj {
    channelname: string; // チャンネル名
    token: string; // トークン
  };
  // 削除用
  interface deletesendobj {
    table: string; // 削除対象テーブル
    id: string; // 削除対象ID
    name: string; // オプション値
  };
}