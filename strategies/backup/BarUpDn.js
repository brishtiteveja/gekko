
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own method
var method = {};

method.init = function() {
    this.name = 'BarUpDn';
    this.input = 'candle';

    this.cross = false;
    this.trend = 'none';
    this.longPrice = -1;

    this.requiredHistory = this.tradingAdvisor.historySize;
    this.pastCandle = [];
}

method.update = function(candle) {

}

method.log = function() {
}

method.check = function(candle) {
    let price = candle;
    if(this.pastCandle.length < this.requiredHistory) {
        this.pastCandle.push(price);
    } else {
        this.pastCandle.shift();
        this.pastCandle.push(price);
    }

    if (this.pastCandle.length >= 3) {
        let pastPrice_1 = this.pastCandle[this.pastCandle.length -1 -1];
        let pastPrice_2 = this.pastCandle[this.pastCandle.length -1 -2];

        if (price.close > price.open && //pastPrice_1.close > pastPrice_1.open && pastPrice_2.close > pastPrice_2.open && 
                price.open >= pastPrice_1.close && //pastPrice_1.open >= pastPrice_2.close &&
                (this.trend == 'none' || this.trend == 'down') 
        ) {
            console.log(price.close);
            console.log(price.open);
            console.log(pastPrice_1.close);
            console.log(pastPrice_1.open);
            console.log(pastPrice_2.close);
            console.log('Uptrend. Long.. ');

            this.trend = 'up';
            this.advice('long');
        }

        if (price.close < price.open && price.open < pastPrice_1.close && 
            this.trend == 'up'
        ) { 
            console.log(price.close);
            console.log(price.open);
            this.trend = 'down';
            this.advice('short');
            console.log('Downtrend. Short.. '); 
        }
    }
}

module.exports = method;
