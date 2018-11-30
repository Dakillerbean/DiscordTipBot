'use strict';

const bitcoin = require('bitcoin');
var https = require("https");

let Regex = require('regex'),
  config = require('config'),
  spamchannels = config.get('moderation').botspamchannels;
let walletConfig = config.get('nebl').config;
let paytxfee = config.get('nebl').paytxfee;
const nebl = new bitcoin.Client(walletConfig);

exports.commands = ['tipbot'];
exports.tipbot = {
  usage: '<subcommand>',
  description:
    '__**Neblio (NEBL) TipBot**__\nTransaction Fees: **' + paytxfee + '**\n    **!tipbot** : Displays This Message\n    **!tipbot balance** : get your balance\n    **!tipbot deposit** : get address for your deposits\n    **!tipbot withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n    **!tipbot tip <@user> <amount>** :mention a user with @ and then the amount to tip them\n    **!tipbot tip private <user> <amount>** : put private before Mentioning a user to tip them privately.\n\n    has a default txfee of ' + paytxfee,
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsg =
        '__**Neblio (NEBL) TipBot**__\nTransaction Fees: **' + paytxfee + '**\n    **!tipbot** : Displays This Message\n    **!tipbot balance** : get your balance\n    **!tipbot deposit** : get address for your deposits\n    **!tipbot withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n    **!tipbot tip <@user> <amount>** :mention a user with @ and then the amount to tip them\n    **!tipbot tip private <user> <amount>** : put private before Mentioning a user to tip them privately.\n\n    **<> : Replace with appropriate value.**',
      channelwarning = 'Please use <#tipbot> or DMs to talk to TipBot.';
    switch (subcommand) {
      case 'help':
        privateorSpamChannel(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'balance':
        doBalance(msg, tipper);
        break;
      case 'deposit':
        privateorSpamChannel(msg, channelwarning, doDeposit, [tipper]);
        break;
      case 'withdraw':
        privateorSpamChannel(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]);
        break;
      case 'tip':
        doTip(bot, msg, tipper, words, helpmsg);
        break;
      case 'price':
        doPrice(msg);
        break;
      case 'stats':
        doStats(msg);
        break;
      default:
        doHelp(msg, helpmsg);
    }
  }
};

function privateorSpamChannel(message, wrongchannelmsg, fn, args) {
  if (!inPrivateorSpamChannel(message)) {
    message.reply(wrongchannelmsg);
    return;
  }
  fn.apply(null, [message, ...args]);
}

function doHelp(message, helpmsg) {
  message.author.send(helpmsg);
}

function doPrice(message) {
  var checkprice = get_json("https://api.coinmarketcap.com/v2/ticker/1955/?convert=BTC", function (resp) {
  	var priceusd  = parseFloat(resp.data.quotes.USD.price).toFixed(2);
  	var usdchange = parseFloat(resp.data.quotes.USD.percent_change_24h).toFixed(2);
    var pricebtc  = parseFloat(resp.data.quotes.BTC.price).toFixed(8);
    var btcchange = parseFloat(resp.data.quotes.BTC.percent_change_24h).toFixed(2);
    var usdarrow = ""
    var btcarrow = ""
    if (usdchange > 0.00) {
      usdarrow = " :arrow_up_small: "
    } else if (usdchange > 10) {
      usdarrow = " :arrow_double_up: "
    } else if (usdchange < 0.00) {
      usdarrow = " :arrow_down_small: "
    } else if (usdchange < -10) {
      usdarrow = " :arrow_double_down: "
    }

    if (btcchange > 0.00) {
      btcarrow = " :arrow_up_small: "
    } else if (btcchange > 10) {
      btcarrow = " :arrow_double_up: "
    } else if (btcchange < 0.00) {
      btcarrow = " :arrow_down_small: "
    } else if (btcchange < -10) {
      btcarrow = " :arrow_double_down: "
    }
    message.channel.send('The current price of NEBL <:nebl:517893431058497542> is: $' + priceusd + ' ' + usdarrow + usdchange + '%  -  ' + pricebtc + 'BTC <:bitcoin:517893081693945880> ' + btcarrow + btcchange + '%');
  });
}

function doStats(message) {
  var checkprice = get_json("https://api.coinmarketcap.com/v2/ticker/1955/?convert=BTC", function (resp) {
  	var priceusd  = parseFloat(resp.data.quotes.USD.price).toFixed(2);
  	var position  = resp.data.rank;
	var volume    = resp.data.quotes.USD.volume_24h;
	var marketcap = resp.data.quotes.USD.market_cap;

    var vol = volume.toString().split(".");
    var mc  = marketcap.toString().split(".");

    vol[0] = vol[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    mc[0]  = mc[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    message.channel.send('NEBL <:nebl:517893431058497542> is: $' + priceusd + ', rank ' + position + ' with a Market Cap of $' + mc[0] + ' and a 24Hr Volume of $' + vol[0]);
  });
}

function doBalance(message, tipper) {
  nebl.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Neblio (NEBL) balance.').then(message => message.delete(10000));
    } else {
    message.channel.send({ embed: {
    description: '**:bank::money_with_wings::moneybag:Neblio (NEBL) Balance!:moneybag::money_with_wings::bank:**',
    color: 1363892,
    fields: [
      {
        name: '__User__',
        value: '<@' + message.author.id + '>',
        inline: false
      },
      {
        name: '__Balance__',
        value: '**' + balance.toString() + '**',
        inline: false
      }
    ]
  } });
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      message.reply('Error getting your Neblio (NEBL) deposit address.').then(message => message.delete(10000));
    } else {
    message.channel.send({ embed: {
    description: '**:bank::card_index::moneybag:Neblio (NEBL) Address!:moneybag::card_index::bank:**',
    color: 1363892,
    fields: [
      {
        name: '__User__',
        value: '<@' + message.author.id + '>',
        inline: false
      },
      {
        name: '__Address__',
        value: '**' + address + '**',
        inline: false
      }
    ]
  } });
    }
  });
}

function doWithdraw(message, tipper, words, helpmsg) {
  if (words.length < 4) {
    doHelp(message, helpmsg);
    return;
  }

  var address = words[2],
    amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply("I don't know how to withdraw that much Neblio (NEBL)...").then(message => message.delete(10000));
    return;
  }

  nebl.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Neblio (NEBL) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        message.channel.send('Please leave atleast ' + paytxfee + ' Neblio (NEBL) for transaction fees!');
        return;
      }
      nebl.sendFrom(tipper, address, Number(amount), function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete(10000));
        } else {
        message.channel.send({embed:{
        description: '**:outbox_tray::money_with_wings::moneybag:Neblio (NEBL) Transaction Completed!:moneybag::money_with_wings::outbox_tray:**',
        color: 1363892,
        fields: [
          {
            name: '__Sender__',
            value: '<@' + message.author.id + '>',
            inline: true
          },
          {
            name: '__Receiver__',
            value: '**' + address + '**\n' + addyLink(address),
            inline: true
          },
          {
            name: '__txid__',
            value: '**' + txId + '**\n' + txLink(txId),
            inline: false
          },
          {
            name: '__Amount__',
            value: '**' + amount.toString() + '**',
            inline: true
          },
          {
            name: '__Fee__',
            value: '**' + paytxfee.toString() + '**',
            inline: true
          }
        ]
      }});
      }
    });
    }
  });
}

function doTip(bot, message, tipper, words, helpmsg) {
  var prv = false;
  var amountOffset = 3;
  if (words.length >= 4 && words[2] === 'private') {
    prv = true;
    amountOffset = 4;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    message.reply("I don't know how to tip that much Neblio (NEBL)...").then(message => message.delete(10000));
    return;
  }

  nebl.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Neblio (NEBL) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        message.channel.send('Please leave atleast ' + paytxfee + ' Neblio (NEBL) for transaction fees!');
        return;
      }

      if (!message.mentions.users.first()){
           message
            .reply('Sorry, I could not find a user in your tip...')
            .then(message => message.delete(10000));
            return;
          }
      if (message.mentions.users.first().id) {
        sendNEBL(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv);
      } else {
        message.reply('Sorry, I could not find a user in your tip...').then(message => message.delete(10000));
      }
    }
  });
}

function sendNEBL(bot, message, tipper, recipient, amount, privacyFlag) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete(10000));
    } else {
          nebl.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
              if (err) {
                message.reply(err.message).then(message => message.delete(10000));
              } else {
                if (privacyFlag) {
                  let userProfile = message.guild.members.find('id', recipient);
                  userProfile.user.send({ embed: {
                  description: '**:money_with_wings::moneybag:Neblio (NEBL) Transaction Completed!:moneybag::money_with_wings:**',
                  color: 1363892,
                  fields: [
                    {
                      name: '__Sender__',
                      value: 'Private Tipper',
                      inline: true
                    },
                    {
                      name: '__Receiver__',
                      value: '<@' + recipient + '>',
                      inline: true
                    },
                    {
                      name: '__txid__',
                      value: '**' + txId + '**\n' + txLink(txId),
                      inline: false
                    },
                    {
                      name: '__Amount__',
                      value: '**' + amount.toString() + '**',
                      inline: true
                    },
                    {
                      name: '__Fee__',
                      value: '**' + paytxfee.toString() + '**',
                      inline: true
                    }
                  ]
                } });
                message.author.send({ embed: {
                description: '**:money_with_wings::moneybag:Neblio (NEBL) Transaction Completed!:moneybag::money_with_wings:**',
                color: 1363892,
                fields: [
                  {
                    name: '__Sender__',
                    value: '<@' + message.author.id + '>',
                    inline: true
                  },
                  {
                    name: '__Receiver__',
                    value: '<@' + recipient + '>',
                    inline: true
                  },
                  {
                    name: '__txid__',
                    value: '**' + txId + '**\n' + txLink(txId),
                    inline: false
                  },
                  {
                    name: '__Amount__',
                    value: '**' + amount.toString() + '**',
                    inline: true
                  },
                  {
                    name: '__Fee__',
                    value: '**' + paytxfee.toString() + '**',
                    inline: true
                  }

                ]
              } });
                  if (
                    message.content.startsWith('!tipbot tip private ')
                  ) {
                    message.delete(1000); //Supposed to delete message
                  }
                } else {
                  message.channel.send({ embed: {
                  description: '**:money_with_wings::moneybag:Neblio (NEBL) Transaction Completed!:moneybag::money_with_wings:**',
                  color: 1363892,
                  fields: [
                    {
                      name: '__Sender__',
                      value: '<@' + message.author.id + '>',
                      inline: true
                    },
                    {
                      name: '__Receiver__',
                      value: '<@' + recipient + '>',
                      inline: true
                    },
                    {
                      name: '__txid__',
                      value: '**' + txId + '**\n' + txLink(txId),
                      inline: false
                    },
                    {
                      name: '__Amount__',
                      value: '**' + amount.toString() + '**',
                      inline: true
                    },
                    {
                      name: '__Fee__',
                      value: '**' + paytxfee.toString() + '**',
                      inline: true
                    }
                  ]
                } });
                }
              }
            });
    }
  });
}

function getAddress(userId, cb) {
  nebl.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      nebl.getNewAddress(userId, function(err, address) {
        if (err) {
          cb(err);
        } else {
          cb(null, address);
        }
      });
    }
  });
}

function inPrivateorSpamChannel(msg) {
  if (msg.channel.type == 'dm' || isSpam(msg)) {
    return true;
  } else {
    return false;
  }
}

function isSpam(msg) {
  return spamchannels.includes(msg.channel.id);
};


function getValidatedAmount(amount) {
  amount = amount.trim();
  if (amount.toLowerCase().endsWith('nebl')) {
    amount = amount.substring(0, amount.length - 3);
  }
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function txLink(txId) {
  return 'https://explorer.nebl.io/tx/' + txId;
}

function addyLink(address) {
  return 'https://explorer.nebl.io/address/' + address;
}

function get_json(url, callback) {
  https.get(url, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      var response = JSON.parse(body);
      callback(response);
    });
  });
}
