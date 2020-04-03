'use strict';
let config = require('config');
let ravenFee = config.get('rvn').paytxfee;
let dogeFee = config.get('doge').paytxfee;
let lbryFee = config.get('lbc').paytxfee;
let phaseFee = config.get('phase').paytxfee;
let ufoFee = config.get('ufo').paytxfee;
let phoenixFee = config.get('pxc').paytxfee;
let featherFee = config.get('ftc').paytxfee;
let verticalFee = config.get('vtl').paytxfee;
let micropaymentcoinFee = config.get('mpc').paytxfee;
exports.commands = ['tiphelp'];
exports.tiphelp = {
  usage: '<subcommand>',
  description: 'This commands has been changed to currency specific commands!',
  process: function(bot, message) {
    message.author.send(
      '__**:bank: Coins :bank:**__\n' +
      '  **MicroPaymentCoin (MPC) Tipper**\n    Transaction Fees: **' + micropaymentcoinFee + '**\n' +
      '__**Commands**__\n' +
      '  **!tip<CoinSymbol>** : Displays This Message\n' +
      '  **!tip<CoinSymbol> balance** : get your MPC balance\n' +
      '  **!tip<CoinSymbol> deposit** : get address for your MPC deposits\n' +
      '  **!tip<CoinSymbol> withdraw <ADDRESS> <AMOUNT>** : withdraw MPC coins to specified address\n' +
      '  **!tip<CoinSymbol> <@user> <amount>** :mention a user with @ and then the amount to tip them\n' +
      '  **!tip<CoinSymbol> private <user> <amount>** : put private before Mentioning a user to tip them privately\n' +
      '**<> : Replace carrot <> symbole with appropriate value.**\n' +
      '__**Examples**__\n' +
      '  **!tipmpc @Username 10**\n' +
      '  **!tipmpc withdraw MPCaddressHERE 10**\n' +
      '  **!tipmpc private @Username 10**\n' +
      '  **!tipmpc balance**\n' +
      '  **!tipmpc deposit**\n'
    );
  }
};
