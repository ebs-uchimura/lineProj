/**
 * app.js
 *
 * function：ビューワ用サーバ
 **/

"use strict"; // strice mode

// モジュール
const express = require("express"); // express
const basicAuth = require("basic-auth-connect"); // basic-auth
const path = require("path"); // path
const SQL = require("./class/sql.js"); // カスタムsql用
require("dotenv").config(); // 環境変数用

// 定数
const SERVERNAME = process.env.SERVERNAME; // サーバ名
const DEFAULT_PORT = process.env.PORT; // ポート

// express設定
var app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// DBインスタンス
const mySQL = new SQL("message");

// basic login
app.all(
    "/*",
    basicAuth((user, password) => {
        return user === process.env.AUTHID && password === process.env.PASSWORD;
    })
);

// トップページ
app.get("/", async(_, res) => {
    try {
        // 全体表示
        const result = await mySQL.selectDB(
            null,
            null,
            null,
            null,
            null,
            null,
            1000,
            true
        );

        // エラー
        if (result == "error") {
            // ページ表示
            showNodataPage(res);
            // エラー処理
            throw new Error("message search error");

        } else {
            // 日時のみ配列
            const datetimeResult = result.map((data) =>
                formatDateInYyyymmdd(data.sentdate)
            );

            // ページ表示
            res.render("index", {
                title: "全会員", // ヘッダ
                data: result, // 全データ
                date: datetimeResult, // 送信日
                error: "",
            });
        }

    } catch (e) {
        console.log(e);
    }
});

// 顧客番号検索
app.post("/searchno", (req, res) => {
    // モード
    console.log("customer no search mode");
    // 顧客番号
    const customerno = req.body.cutomerno;

    // 顧客番号あり
    if (customerno) {
        // 検索
        searchBase(1, customerno, res);
    }
});

// 顧客名検索
app.post("/searchname", (req, res) => {
    // モード
    console.log("customer name search mode");
    // 顧客名
    const customername = req.body.customername;

    // 顧客名あり
    if (customername) {
        // 検索
        searchBase(2, customername, res);
    }
});

// 3000番でLISTEN
app.listen(DEFAULT_PORT, () => {
    console.log(`${SERVERNAME} listening on port ${DEFAULT_PORT}`);
});

// 検索
const searchBase = async(no, key, res) => {
    try {
        // モード
        console.log("search mode");
        // 顧客番号(old)
        let oldNo = 0;
        // 検索キー
        let tmpKey = "";
        // 顧客名(old)
        let oldCustomer = "";
        // 他
        let otherStr = "";
        // 顧客番号
        let customerNoArray = [];
        // 正規表現
        const pattern1 = /[0-9]{6,7}/g;
        const pattern2 = /№[0-9]{6,7}/g;

        // 番号モード
        if (no == 1) {
            // 検索キーはそのまま
            tmpKey = key;

        } else if (no == 2) {
            // 顧客番号検索
            const customerno = await mySQL.fuzzySelectDB(
                "sendername",
                key,
                null,
                "id",
                1
            );

            // ヒットなし
            if (customerno == "error") {
                // ページ表示
                showNodataPage(res);
                // エラー処理
                throw new Error("filename search error");
            }
            // ファイル名
            tmpKey = customerno[0].filename;
        }

        // ファイル名検索
        const customer = await mySQL.fuzzySelectDB(
            "filename",
            tmpKey,
            null,
            "id",
            100
        );

        // エラー
        if (customer == "error") {
            // ページ表示
            showNodataPage(res);
            // エラー処理
            throw new Error("message search error");
        }

        // 日時のみ配列
        const datetimeResult = customer.map((data) =>
            formatDateInYyyymmdd(data.sentdate)
        );

        // 顧客番号リスト作成
        customer.map((element) => {
            // 送信者
            const sendername = element.sendername;
            // ファイル名
            const filename = element.filename;

            // 送信者に顧客番号を含む
            if (pattern1.test(sendername)) {
                // 店舗名一時保存
                oldCustomer = sendername;
            }

            // ファイル名に顧客番号を含む
            if (pattern2.test(filename)) {
                // №顧客番号を返す
                const tmpNo = String(filename.match(pattern2));
                // 一時保存
                oldNo = Number(tmpNo.replace("№", ""));
                // №顧客番号配列
                customerNoArray.push(oldNo);

            } else {
                // 空白を入れる
                customerNoArray.push(oldNo);
            }
        });

        // セット
        const numbersSet = new Set(customerNoArray);

        // 店舗数が2以上
        if (numbersSet.size > 1) {
            otherStr = "..他";
        }

        // ページ表示
        res.render("index", {
            title: `${oldCustomer}${otherStr}`, // ヘッダ
            data: customer, // 全データ
            date: datetimeResult, // 送信日
            error: "",
        });

    } catch (e) {
        console.log(e);
    }
}

// データなし
const showNodataPage = res => {
    // ページ表示
    res.render("index", {
        title: "検索結果", // ヘッダ
        data: "", // 全データ
        date: "", // 送信日
        customerno: "", // 顧客番号
        error: "一致するデータがありません",
    });
}

// 「yyyymmdd」形式の日付文字列に変換する関数
const formatDateInYyyymmdd = date => {
    const y = date.getFullYear();
    const mh = date.getMonth() + 1;
    const d = date.getDate();

    const yyyy = y.toString();
    const mhmh = ('00' + mh).slice(-2);
    const dd = ('00' + d).slice(-2);

    return `${yyyy}/${mhmh}/${dd}`;
}
