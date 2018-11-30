'use strict';
let config = require('config');
let neblioFee = config.get('nebl').paytxfee;
exports.commands = ['tiphelp'];
exports.tiphelp = {
  usage: '<subcommand>',
  description: 'This commands has been changed to currency specific commands!',
  process: function(bot, message) {
    message.author.send(
      '  **Neblio (NEBL) TipBot**\n    Transaction Fees: **' + neblioFee + '**\n' +
      '__**Commands**__\n' +
      '  **!tipbot** : Displays This Message\n' +
      '  **!tipbot balance** : get your balance\n' +
      '  **!tipbot deposit** : get address for your deposits\n' +
      '  **!tipbot withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n' +
      '  **!tipbot tip <@user> <amount>** :mention a user with @ and then the amount to tip them\n' +
      '  **!tipbot tip private <@user> <amount>** : put private before Mentioning a user to tip them privately\n' +
      '__**Examples**__\n' +
      '  **!tipbot tip @nebliodev 10**\n' +
      '  **!tipbot withdraw NEBLaddressHERE 10**\n' +
      '  **!tipbot private @nebliodev 10**\n' +
      '  **!tipbot balance**\n' +
      '  **!tipbot deposit**\n'
    );
  }
};
