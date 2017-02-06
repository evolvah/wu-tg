var TelegramBot = require('node-telegram-bot-api');
var request     = require('request');
var CronJob     = require('cron').CronJob;
var cmdArgs     = require('optimist').argv;

var tgBot       = new TelegramBot(cmdArgs['tg-bot-token'], { polling: true });

tgBot.broadcastText = function(chatIds, msg) {
  chatIds.forEach(function(chatId) {
    tgBot.sendMessage(chatId, msg)
  });
};

tgBot.chats = cmdArgs['tg-recipient-chat-ids'].toString().split(',');

tgBot.onText(/\/start$/, function (msg) {
  tgBot.sendMessage(msg.chat.id, `Hello! Your chatId is ${msg.chat.id}`);
});

function publishForecast() {
  var options = {
    uri: `http://api.wunderground.com/api/${cmdArgs['wu-api-key']}/conditions/forecast/q/${cmdArgs['wu-station-id']}.json`,
    method: 'GET'
  };

  request(options, function(error, response, body){
    if(error) tgBot.broadcastText(this.chats, "error");
    else {
      var resp         = JSON.parse(body);
      var current_tC   = resp.current_observation.temp_c;
      var todays_lowC  = resp.forecast.simpleforecast.forecastday[0].low.celsius;
      var todays_highC = resp.forecast.simpleforecast.forecastday[0].high.celsius;
      var pop          = resp.forecast.simpleforecast.forecastday[0].pop;
      var conditions   = resp.forecast.simpleforecast.forecastday[0].conditions;
      var message      = `${current_tC}°C,${todays_lowC}..${todays_highC}°C,${pop}%,${conditions}`;
      //console.log(message);
      tgBot.broadcastText(tgBot.chats, message);
    }
  });
};

var weekdayJob = new CronJob('00 44 06 * * 1-5', publishForecast, null, true, 'America/Chicago', null, true);
var weekendJob = new CronJob('00 55 07 * * 0,6', publishForecast, null, true, 'America/Chicago', null, false);
