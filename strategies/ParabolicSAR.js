
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own method
var method = {};

method.init = function() {
    this.name = 'Parabolic SAR';
    this.input = 'candle';

    this.trend = 'none';

	this.totalCandles = 0;

	this.supports = [];
	this.resistances = [];

	this.prevCandles = [];

    this.requiredHistory = this.tradingAdvisor.historySize;

    var SARSettings = {
        optInAcceleration: 0.02,
        optInMaximum: 0.2
    };

    this.addTalibIndicator('sar', 'sar', SARSettings);
    console.log(this.tradingAdvisor);
    console.log(this.requiredHistory);
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
	this.totalCandles++;

	if(this.prevCandles.length == 3) {

		// find support
		if(this.prevCandles[0].high < this.prevCandles[1].high && this.prevCandles[1].high > this.prevCandles[2].high) {
			this.resistances.push(this.prevCandles[1]);
		} else if(this.prevCandles[0].low > this.prevCandles[1].low && this.prevCandles[1].low < this.prevCandles[2].low) {
			this.supports.push(this.prevCandles[1]);
		}

		this.prevCandles = [];
	} else {
		this.prevCandles.push(candle);
	}


	let date = candle.start._d;
	//console.log(date);
    let open = candle.open;
    let high = candle.high;
    let low = candle.low;
    let close = candle.close;
    
    let sar = this.talibIndicators.sar.result.outReal;

    let message = '@ open=' + open.toFixed(8) + ', ' + 'high=' + high.toFixed(8) + ', ' + 'low=' + low.toFixed(8) + ', ' + 'close=' + close.toFixed(8); 

    if (sar >= high && (this.trend == 'down' || this.trend == 'none' )) {
        //console.log('Uptrend. Long.. ', message) 
        this.trend = 'up';
        this.advice('long');
    } else if (sar <= low && (this.trend == 'up' || this.trend == 'none' )) {
        //console.log('Downtrend. Short.. ', message) 
        this.trend = 'down';
        this.advice('short');
    }
}

method.end = function(candle) {
		console.log("Resistance");
		console.log(this.resistances.length);
		for(i=0; i<this.resistances.length; i++) {
			let date = this.resistances[i].start._d;
			let resistance = this.resistances[i].high;
			console.log(date + " = " + resistance);
		}
		console.log(" ");

		console.log("Support");
		console.log(this.supports.length);
		for(i=0; i<this.supports.length; i++) {
			let date = this.supports[i].start._d;
			let support = this.supports[i].low;
			console.log(date + " = " + support);
		}

		console.log(" ");
		console.log("Total Candles = " + this.totalCandles);
		console.log("Total Resistance Candles = " + this.resistances.length);
		console.log("Total Support Candles = " + this.supports.length);
}

module.exports = method;
