'use strict';
let config = require('config');
let neblioFee = config.get('nebl').paytxfee;
exports.commands = ['tiphelp'];
exports.tiphelp = {
  usage: '<subcommand>',
  description: 'This commands has been changed to currency specific commands!',
  process: function(bot, message) {
    message.author.send(
      '  **Neblio (NEBL) Tipper**\n    Transaction Fees: **' + neblioFee + '**\n' +
      '__**Commands**__\n' +
      '  **!tipnebl** : Displays This Message\n' +
      '  **!tipnebl balance** : get your balance\n' +
      '  **!tipnebl deposit** : get address for your deposits\n' +
      '  **!tipnebl withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n' +
      '  **!tipnebl <@user> <amount>** :mention a user with @ and then the amount to tip them\n' +
      '  **!tipnebl private <@user> <amount>** : put private before Mentioning a user to tip them privately\n' +
      '__**Examples**__\n' +
      '  **!tipnebl @nebliodev 10**\n' +
      '  **!tipnebl withdraw NEBLaddressHERE 10**\n' +
      '  **!tipnebl private @nebliodev 10**\n' +
      '  **!tipnebl balance**\n' +
      '  **!tipnebl deposit**\n'
    );
  }
};
