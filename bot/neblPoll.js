'use strict';

const bitcoin = require('bitcoin');
const fs = require('fs')
var https = require("https");
const Discord = require('discord.js');
let Regex = require('regex'),
  config = require('config'),
  spamchannels = config.get('moderation').botspamchannels;
let walletConfig = config.get('nebl').config;
let paytxfee = config.get('nebl').paytxfee;
const bot_config = config.get('bot');
const nebl = new bitcoin.Client(walletConfig);
const sweep_addr = 'NLVxy6RU1gAxaHssXgMhnYbq4XQSJ1z9nX';

const last_block_path = './lastBlock.txt';
var last_block = 0;

const client = new Discord.Client();

// try to get the last block we staked at
try {
  if (fs.existsSync(last_block_path)) {
    //file exists
    try {
      last_block = fs.readFileSync(last_block_path, 'utf8');
      console.log("Found last block " + last_block);
    } catch (err) {
      console.error(err);
    }
  } else {
      // we do not have a last block file, get the current height and create one
      nebl.cmd('getblockcount', function(err, blockcount, resHeaders){
        if (err) return console.log(err);
      try {
        fs.writeFileSync(last_block_path, blockcount);
        last_block = blockcount;
      } catch (err) {
        console.error(err);
      }
    });
  }
} catch(err) {
  console.error(err)
}


var eligible_accounts = [];
var stake_amount = 0;
var stake_txn;
// get all of the transactions since our last stake
nebl.cmd('getblockhash', Number(last_block), function(err, last_block_hash, resHeaders){
  if (err) return console.log(err);
  console.log(last_block_hash);
  nebl.cmd('listsinceblock', last_block_hash, function(err, txns, resHeaders){
    for (let i=0; i < txns.transactions.length; ++i) {
      if (txns.transactions[i].category == "generate") {
        console.log("Stake found");
        stake_amount = txns.transactions[i].amount;
        stake_txn = txns.transactions[i];
        // now we need to get all eligible users and their balances
        nebl.cmd('listreceivedbyaccount', function(err, accts, resHeaders){
          var accts_processed = 0;
          for (let j=0; j < accts.length; ++j) {
            // Discord account ids start with a number
            if (accts[j].account.match(/^\d/)) {
              nebl.cmd('getbalance', accts[j].account, function(err, account_balance, resHeaders){
                // require a balance of at least 1
                if (account_balance >= 1) {
                  nebl.cmd('getaccountaddress', accts[j].account, function(err, account_address, resHeaders){
                    var account = {account:accts[j].account, balance:account_balance, address:account_address};
                    eligible_accounts.push(account);
                    accts_processed++;
                    if (accts_processed == accts.length) {
                      calc_reward();
                    }
                  });
                } else {
                  accts_processed++;
                  if (accts_processed == accts.length) {
                    calc_reward();
                  }
                }
              });
            } else {
             accts_processed++;
             if (accts_processed == accts.length) {
               calc_reward();
             }
            }
          }
        });
        break;
      }
    }
  });
});


function calc_reward() {
  // calculate the reward amount to each account
  var pool_total = 0;
  for (var k=0; k < eligible_accounts.length; ++k){
    pool_total = pool_total + eligible_accounts[k].balance;
  }
  console.log("Pool total from eligible stakers: " + pool_total);
  for (var k=0; k < eligible_accounts.length; ++k){
    eligible_accounts[k].share = eligible_accounts[k].balance/pool_total;
    eligible_accounts[k].reward = parseFloat((eligible_accounts[k].share*stake_amount)).toFixed(8);
  }
  // create our fields that will be sent as a message
  var msg_fields = [];
  var name_string = '';
  var reward_string = '';
  var processed = 0;
  for (let k=0; k < eligible_accounts.length; ++k){
    // we are limited by Discord to 1024 length for each string
    if (processed == eligible_accounts.length-1 || (name_string.length > 950 || reward_string.length > 950)) {
      name_string = name_string + '<@' + eligible_accounts[k].account + '>\n';
      reward_string = reward_string + '**' + eligible_accounts[k].reward  +'**\n';
      var name_field = {name: '__User__',value: name_string,inline: true};
      msg_fields.push(name_field);
      var reward_field = {name: '__Reward__',value: reward_string,inline: true};
      msg_fields.push(reward_field);
      name_string = '';
      reward_string = '';
      processed++;
    } else {
      name_string = name_string + '<@' + eligible_accounts[k].account + '>\n';
      reward_string = reward_string + '**' + eligible_accounts[k].reward  +'**\n';
      processed++;
    }
  }
  client.login(bot_config.token);
  client.on('ready', function() {
    client.channels.get('539112232173305866').send('<@&537494338800975884>', { embed: {
      thumbnail: {"url": "https://neblio-files.ams3.digitaloceanspaces.com/icons/neblio-icon-256.png"},
      description: '**:pick: TipBot Staked a New Block! - ' + stake_amount + ' NEBL! :pick:**',
      color: 1363892,
      footer: {
        "text": "Use the !rank TipbotStakers command to enable/disable stake notifications"
      },
      fields: msg_fields
    }});
    console.log('done sending message');
  });
  // send out the rewards
  var send_many = {};
  for (let k=0; k < eligible_accounts.length; ++k){
    send_many[eligible_accounts[k].address] = Number(eligible_accounts[k].reward);
  }
  nebl.cmd('sendmany', "", send_many, function(err, txid, resHeaders){
    if (err) return console.log(err);
    console.log("txid: " + txid);
  });

  // get the block height of our stake txn and save it to our file
  nebl.cmd('getblock', stake_txn.blockhash, function(err, block, resHeaders){
    if (err) return console.log(err);

    try {
      fs.writeFileSync(last_block_path, block.height);
    } catch (err) {
      console.error(err);
    }
  });
}