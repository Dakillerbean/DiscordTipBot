'use strict';

const bitcoin = require('bitcoin');

let Regex = require('regex'),
  config = require('config');
let walletConfig = config.get('nebl').config;
let paytxfee = config.get('nebl').paytxfee;
const nebl = new bitcoin.Client(walletConfig);
const sweep_addr = 'NLVxy6RU1gAxaHssXgMhnYbq4XQSJ1z9nX';

nebl.cmd('listunspent', function(err, unspents, resHeaders){
  if (err) return console.log(err);
  for (var i=0; i < unspents.length; ++i) {
    if (unspents[i].address == sweep_addr) {
      console.log('Found Sweep Address, Skipping');
    } else {
      var txid_vout = [{"txid":unspents[i].txid,"vout":unspents[i].vout}];
      var total = unspents[i].amount - 0.0001;
      var addr_amount = {[sweep_addr]:total};
      nebl.cmd('createrawtransaction', txid_vout, addr_amount, function(err, rawtxn, resHeaders){
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