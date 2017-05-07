function myFunction() {
  
}

//このファイル外で必要な設定は下記。
//(1)スクリプトプロパティの設定。Gas_Properties/post_Gcal_to_Slack.txtを参照。
//(2)ライブラリの導入。参考URL: http://qiita.com/soundTricker/items/43267609a870fc9c7453
//　手順：
//　　GAS Editorを開きます。
//　　上のメニューから「リソース」→「ライブラリを管理...」を選択します。
//　　「含まれているライブラリ」というダイアログが表示されるので下にある「ライブラリを検索」横のテキストボックスに「M3W5Ut3Q39AaIwLquryEPMwV62A3znfOO」を入力します。(この値をプロジェクトキーと言います)
//　　「選択」ボタンを押して少し待つと、上の一覧にタイトル underscoreGSというのが出ます。
//　　「バージョン」欄で任意のバージョンを選択します。最新でいいと思います。
//　　下にある「保存」ボタンを押します。 ※他の物については後で説明します。
//　　開いていたダイアログが閉じ、ライブラリが取り込まれた旨が表示されたらOKです。
//(3)トリガーの設定
//　手順：
//　　GAS Editorを開く。
//　　編集→現在のプロジェクトのトリガー、「トリガーが設定されていません。今すぐ追加するにはここをクリックしてください。」をクリック。


//-----------毎朝、当日の予定（Gカレンダーのイベント）をpostする。GASのトリガーを使って朝に起動する。-----------
function postGcal() {
  
//実行時の日付を取得
  var dt = new Date();
  var strDt = Utilities.formatDate(dt, 'JST', 'yyyy-MM-dd');

//googleカレンダーから情報を取得
  var strBody='本日の予定をお知らせします。\n';

  //1つ目のカレンダのイベント取得
  var calID = PropertiesService.getScriptProperties().getProperty('CAL_ID_MAIN');    
  strBody=strBody + '[Main]'+ '\n'; //どのカレンダのコンテンツかを示す行 
  strBody = strBody + getCalList(calID,dt);
  
  // 2つ目のカレンダのイベント取得
  calID = PropertiesService.getScriptProperties().getProperty('CAL_ID_TEKITODO');    
  strBody=strBody + '[定期ToDo]'+ '\n'; //どのカレンダのコンテンツかを示す行 
  strBody = strBody + getCalList(calID,dt);  

  // 3つ目のカレンダのイベント取得
  calID = PropertiesService.getScriptProperties().getProperty('CAL_ID_ENGEI'); 
  strBody=strBody + '[ガーデニングToDo]'+ '\n'; //どのカレンダのコンテンツかを示す行 
  strBody = strBody + getCalList(calID,dt);  

//Logger.log(strBody);
  
//slackへのpost
  var token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
  var bot_name = "秘書bo";
  var bot_icon = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_ICON');

  var slackApp = SlackApp.create(token); //SlackApp インスタンスの取得
  var options = {
    channelId: "#general", //チャンネル名
    userName: bot_name, //投稿するbotの名前
    message: strBody //投稿するメッセージ
  };
  slackApp.postMessage(options.channelId, options.message, {
    username: options.userName,
    icon_url: bot_icon
  });
}

//関数定義：カレンダと日付を引数で指定。スケジュールのリストを文字列で返す。
//返す文字列を「SPACE+TAB+文字列」としているのは、これまで作ってきたWJとの互換性維持のため。
//16/9/23 10:47：　一応、ほぼ動作問題なし。実運用開始。
//16/9/24 17:15：　「予定なし」の場合に「SPACE+TAB+文字列」で返していないことを修正。

function getCalList(calID,dt){
  var returnStr = '';
  var targetCal = CalendarApp.getCalendarById(calID); //指定されたIDのカレンダーを取得
  var evetsInTargetCal = targetCal.getEventsForDay(dt);　//カレンダーの本日のイベントを取得

  if (evetsInTargetCal.length == 0){
    returnStr=' \t' + '予定なし' + '\n';//イベントの数がゼロの場合は、「予定なし」と表示
  }else{
    for(var i=0;i<evetsInTargetCal.length;i++){
      var strTitle=evetsInTargetCal[i].getTitle(); //イベントのタイトル
      var strStart = _HHmm(evetsInTargetCal[i].getStartTime()); //イベントの開始時刻
      var strEnd = _HHmm(evetsInTargetCal[i].getEndTime()); //イベントの終了時刻
        if (strStart == strEnd){
          returnStr = returnStr + ' \t' +strTitle + '\n';
        }else{
          returnStr = returnStr + ' \t' + strStart + ' - ' + strEnd + '\t' +strTitle + '\n';
        }
    }
    }
return returnStr;  
}

/* 関数定義：時刻の表記をHH:mmに変更 */
function _HHmm(str){
  return Utilities.formatDate(str, 'JST', 'HH:mm');
}
