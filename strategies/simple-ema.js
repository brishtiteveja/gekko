
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own method
var method = {};

method.init = function() {
    this.name = 'simple-ema';
    this.input = 'candle';

    this.cross = false;
    this.trend = 'none';

    this.requiredHistory = this.tradingAdvisor.historySize;

    var customEMA12Settings = {
        optInTimePeriod: 12
    };
    var customEMA26Settings = {
        optInTimePeriod: 26
    };
    var customSMA55Settings = {
        optInTimePeriod: 55 
    };
    
    this.addTalibIndicator('ema12', 'ema', customEMA12Settings);
    this.addTalibIndicator('ema26', 'ema', customEMA26Settings);
    this.addTalibIndicator('sma55', 'sma', customSMA55Settings);
}

method.update = function(candle) {

}

method.log = function() {
    let ema12 = this.talibIndicators.ema12.result.outReal;
    let ema26 = this.talibIndicators.ema26.result.outReal;
    let sma55 = this.talibIndicators.sma55.result.outReal;
    let diff = ema12 - sma55;

/*
    console.log('Calculated EMA12, EMA26, SMA55');
    console.log('\t EMA12: ', ema12);
    console.log('\t EMA26: ', ema26);
    console.log('\t SMA55: ', sma55);
    console.log('\t EMA12-SMA55 = ', diff);
*/
}

method.check = function(candle) {
    let price = candle.close;
    let resultEma12 = this.talibIndicators.ema12.result.outReal;
    let resultEma26 = this.talibIndicators.ema26.result.outReal;
    let resultSma55 = this.talibIndicators.sma55.result.outReal;
    let diff = resultEma12 - resultSma55;

    let message = '@ ' + price.toFixed(8) + ' (EMA12=' + resultEma12 + ' , SMA55=' + resultSma55 +' /' + diff + ')';

    if (diff >= -2.025 && diff <= 2.025) {
        // crossed
        this.cross = true;
        console.log('Crossover between ema12 and sma55 happened. ', message) 
    } else {
        if(this.cross) { 
            if(diff > 0 && (this.trend == 'down' || this.trend == 'none')) {
                console.log('Uptrend. ema12 has crossed sma55 from below. Long.. ', message) 
                this.trend = 'up';
                this.advice('long');
            } else if (diff < 0 && this.trend == 'up'){
                console.log('Downtrend. ema12 has crossed sma55 from above. Short.. ', message) 
                this.trend = 'down';
                this.advice('short');
            } 
            console.log('Disabling crossover flag') 
            this.cross = false;
        }
    }
}

module.exports = method;
