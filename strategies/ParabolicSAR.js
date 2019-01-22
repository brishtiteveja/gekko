
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own method
var method = {};

method.init = function() {
    this.name = 'Parabolic SAR';
    this.input = 'candle';

    this.trend = 'none';

    this.requiredHistory = this.tradingAdvisor.historySize;

    var SARSettings = {
        optInAcceleration: 0.02,
        optInMaximum: 0.2
    };

    this.addTalibIndicator('sar', 'sar', SARSettings);
}

method.update = function(candle) {

}

method.log = function() {
    let sar = this.talibIndicators.sar.result.outReal;

/*
    console.log('Calculated SAR');
    console.log('\t SAR: ', sar);
*/
}

method.check = function(candle) {
    let open = candle.open;
    let high = candle.high;
    let low = candle.low;
    let close = candle.close;
    
    let sar = this.talibIndicators.sar.result.outReal;

    let message = '@ open=' + open.toFixed(8) + ', ' + 'high=' + high.toFixed(8) + ', ' + 'low=' + low.toFixed(8) + ', ' + 'close=' + close.toFixed(8); 

    if (sar >= high && (this.trend == 'down' || this.trend == 'none' )) {
        console.log('Uptrend. Long.. ', message) 
        this.trend = 'up';
        this.advice('long');
    } else if (sar <= low && (this.trend == 'up' || this.trend == 'none' )) {
        console.log('Downtrend. Short.. ', message) 
        this.trend = 'down';
        this.advice('short');
    }
}

module.exports = method;
