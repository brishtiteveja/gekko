var util = require('../../core/util.js');
var dirs = util.dirs();
var config = util.getConfig();
var moment = require('moment');

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyPath: config.sqlite.dataDirectory
}

var sqlite = require('./handle');
var sqliteUtil = require('./util');

var Reader = require(dirs.plugins + config.adapter + '/reader');
reader = new Reader;

var endTime = moment(config.importer.daterange.to).utc()
var idealStartTime = moment(config.importer.daterange.from).utc()

reader.getAllGaps(idealStartTime, endTime, function(gaps) {
    console.log("gaps");
    console.log(gaps);
    /*
    console.log(localData);
    var from = localData.from;
    var to = localData.to;
    from = moment.unix(from).format();
    to = moment.unix(to).format();

    console.log(from);
    console.log(to);
   */ 
});
