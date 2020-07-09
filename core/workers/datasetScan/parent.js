var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var os = require('os');
var fs = require('fs');

var util = require('../../util');
var dirs = util.dirs();

var dateRangeScan = require('../dateRangeScan/parent');

module.exports = function(config, done) {

  util.setConfig(config);

  var adapter = config[config.adapter];
  var scan = require(dirs.gekko + adapter.path + '/scanner');

  var preScannedMarketRespFile = dirs.gekko + "history/scanned_market.json";
  var preScannedMarketResp = null;
  try {
    console.log("Reading prescanned response file.");
    preScannedMarketResp = require(preScannedMarketRespFile); 
  } catch(e) {
    console.log("No pre scanned history json. May be loading data for the first time.");
  }

  if (!preScannedMarketResp) {
    scan((err, markets) => {
      if(err) {
        return done(err);
      }

      let numCPUCores = os.cpus().length;
      if(numCPUCores === undefined)
         numCPUCores = 1;

      async.eachLimit(markets, numCPUCores, (market, next) => {
          console.log("Daterange for following market :");
          console.log(market);
    
          let marketConfig = _.clone(config);
          marketConfig.watch = market;

          dateRangeScan(marketConfig, (err, ranges) => {
            if(err)
              return next();
    
            var from = moment.utc(ranges.first).format("YYYY-MM-DD HH:mm:ss");
            var to = moment.utc(ranges.to).format("YYYY-MM-DD HH:mm:ss");
            console.log("Daterange: From = " + from + ", To = " + to);
    
            market.ranges = ranges;
    
            next();
          });
    }, err => {
      let resp = {
        datasets: [],
        errors: []
      }

      markets.forEach(market => {
        if(market.ranges)
          resp.datasets.push(market);
        else
          resp.errors.push(market);
      });

      try {
        console.log("Writing prescanned response file for market");
        fs.writeFile(preScannedMarketRespFile, JSON.stringify(resp), (err) => {
            if (err) throw err;
        });
      } catch(e) {
        console.log("Error writing prescanned ranges json file.");
        console.log(e);
      }

      done(err, resp);
    })
  });
 } else {
    console.log("Loading dateranges from prescanned response file.");
    done(null, preScannedMarketResp);
 }
}
