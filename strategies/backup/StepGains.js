/*

  StepGains 16/02/2019


 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var watchPrice = 0.0;
var lowestPrice = 0.0;
var sellPrice = 0.0;
var stopLossPrice = 0.0;
var advised = false;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

}

// what happens on every new candle?
method.update = function(candle) {
  log.debug('\t', 'time: ', candle.start);
  log.debug('\t', 'close price: ', candle.close);
  //console.log('\t', 'time: ', candle.start);
  //console.log('\t', 'close price: ', candle.close);
}

method.log = function() {
}

method.check = function(candle) {
    var profitPerc = 1;
    var lossPerc = 1; 
    if(watchPrice == 0) {
        watchPrice = candle.close * 0.98;
    }

    if (candle.close <= watchPrice) {
        lowestPrice = candle.close;
    }

    if (candle.close > lowestPrice && !advised) {
        log.debug("Buying at ", candle.close); 
        console.log("Buying at ", candle.close); 
        this.advice("long"); 
        sellPrice = candle.close * (1 + profitPerc/100.0);
        stopLossPrice = candle.close * (1 - lossPerc/100.0); 
        advised = true;
    }

    if ((watchPrice != 0 && sellPrice != 0) && 
        (candle.close > sellPrice) ){// || candle.close < stopLossPrice) ) {
        if (candle.close > sellPrice) {
            log.debug("Selling at ", candle.close); 
            console.log("Selling at ", candle.close); 
        } /* else if (candle.close < stopLossPrice) {
            log.debug("StopLoss: Selling at ", candle.close); 
            console.log("StopLoss: Selling at ", candle.close); 
        } */ 

        this.advice("short");
        watchPrice = 0;
        lowestPrice = 0;
        sellPrice = 0;
        stopLossPrice = 0;
        advised = false;
    }
}

module.exports = method;
