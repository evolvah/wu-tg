// Daily weather reporting bot
// Sends today's forecast to the lock screen of your phone
// Depends on Weather Underground and Telegram Messenger

// Parse command-line arguments
var cmdArgs     = require('optimist').argv;
// Instantiate a Telegram Bot API
var TelegramBot = require('node-telegram-bot-api');
// Instantiate a simple HTTP client
var request     = require('request');
// Instantiate a crontab-like task scheduler
var CronJob     = require('cron').CronJob;
// BRing up a Telegram Bot using the previously acquired bot token
var tgBot       = new TelegramBot(cmdArgs['tg-bot-token'], { polling: true });

// Add a method that broadcasts a given message to a group of chatIDs
tgBot.broadcastText = function(chatIds, msg) {
  chatIds.forEach(function(chatId) {
    tgBot.sendMessage(chatId, msg)
  });
};

// List of chaIDs to send the weather info to
tgBot.chats = cmdArgs['tg-recipient-chat-ids'].toString().split(',');

// Advertise the chatID to the client
tgBot.onText(/\/start$/, function (msg) {
  tgBot.sendMessage(msg.chat.id, `Hello! Your chatId is ${msg.chat.id}`);
});

// Retrieve, parse, and broadcast the forecast
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

// Schedules for weekdays and weekend
var weekdayJob = new CronJob('00 44 06 * * 1-5', publishForecast, null, true, 'America/Chicago', null, true);
var weekendJob = new CronJob('00 55 07 * * 0,6', publishForecast, null, true, 'America/Chicago', null, false);
