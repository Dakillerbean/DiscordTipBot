'use strict';

const bitcoin = require('bitcoin');

let Regex = require('regex'),
  config = require('config');
let walletConfig = config.get('nebl').config;
let paytxfee = config.get('nebl').paytxfee;
const nebl = new bitcoin.Client(walletConfig);
const sweep_addr = 'NLVxy6RU1gAxaHssXgMhnYbq4XQSJ1z9nX';

// get all unspents with 20+ confirmations
nebl.cmd('listunspent', 20, function(err, unspents, resHeaders){
  if (err) return console.log(err);
  var txid_vouts = [];
  var total = 0;
  var processed = 0;
  for (let i=0; i < unspents.length; ++i) {
    if (unspents[i].address == sweep_addr) {
      processed++;
    } else {
      var txid_vout = {"txid":unspents[i].txid,"vout":unspents[i].vout};
      txid_vouts.push(txid_vout);
      total = total + unspents[i].amount;
      processed++;
    }
    // once we have processed all our unspents, build our transaction
    if (processed == unspents.length && txid_vouts.length > 0){
      // rough fee calculation
      var est_size = (txid_vouts.length*150) + 50;
      var fee = Math.ceil(est_size / 1000) * 0.0001;
      fee = fee < 0.0001 ? 0.0001 : fee;
      fee = Math.ceil(fee / 0.0001) * 0.0001; // round up to nearest 0.0001
      total = total - fee;
      var addr_amount = {[sweep_addr]:total};
      nebl.cmd('createrawtransaction', txid_vouts, addr_amount, function(err, rawtxn, resHeaders){
        if (err) return console.log(err);
        nebl.cmd('signrawtransaction', rawtxn, function(err, signedtxn, resHeaders){
          if (err) return console.log(err);
          nebl.cmd('sendrawtransaction', signedtxn.hex, function(err, txid, resHeaders){
            if (err) return console.log(err);
            console.log('txid: ' + txid);
          });
        });
      });
    }
  }
});