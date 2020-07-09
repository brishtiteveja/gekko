const util = require('../../core/util.js');
const _ = require('lodash');
const moment = require('moment');
const log = require('../../core/log');

const config = util.getConfig();

const dirs = util.dirs();

const QUERY_DELAY = 350;
const BATCH_SIZE = 100;
const SCAN_ITER_SIZE = 50000;
const BATCH_ITER_SIZE = BATCH_SIZE * 10;

const Fetcher = require(dirs.exchanges + 'gdax');

var allGaps = [];
var currentGapID = null;
var currentGap = null;
var Reader = require(dirs.plugins + config.adapter + '/reader');
reader = new Reader;

const retry = require(dirs.exchanges + '../exchangeUtils').retry;

Fetcher.prototype.getTrades = function(sinceTid, callback) {
  let lastScan = 0;

  const handle = (err, data) => {
    if (err) return callback(err);

    let result = _.map(data, function(trade) {
      return {
        tid: trade.trade_id,
        amount: parseFloat(trade.size),
        date: moment.utc(trade.time).format("X"),
        price: parseFloat(trade.price)
      };
    });

    callback(null, result.reverse());
  };

  log.debug("Getting Trades");
  const fetch = cb => {
      console.log("Batch Id = " + sinceTid);
      this.gdax_public.getProductTrades(this.pair, { after: sinceTid, limit: BATCH_SIZE }, this.processResponse('getTrades', cb));
  };
  retry(null, fetch, handle);
};

Fetcher.prototype.findFirstTradeIDsForGaps = function(sinceTs, callback) {
  let currentId = 0;
  let sinceM = moment.unix(sinceTs).utc();
  let scanSize = -1;

  const handle = (err, data) => {
    if (err) return callback(err);

    let m = moment.utc(_.first(data).time);
    let ts = m.unix();
    console.log("current trade time = " + moment.unix(ts).utc().format());
    console.log("search target trade time = " + moment.unix(sinceTs).utc().format());
    console.log("time diff = " + moment.unix(ts).from(moment.unix(sinceTs), true));
    let tsDiff = (ts - sinceTs)/2; // exponentially decreasing 
    scanSize = tsDiff;

    if (ts < sinceTs) {
      var firstBatchID = currentId - SCAN_ITER_SIZE; 
      log.info(`First trade ID for batching for gap no. ${currentGapID} found ${currentId - SCAN_ITER_SIZE}`);

      currentGap['firstBatchID'] = firstBatchID;
      currentGap['firstBatchTime'] = m.format();
      currentGapID += 1;
      currentGap = allGaps[currentGapID];

      if (currentGapID == allGaps.length) {
        // reset gap id for import start
        currentGapID = 0;
        return callback(undefined, undefined);
      }
          
      console.log("sinceTS updated to " + sinceTs);
      sinceTs = currentGap['start']

      log.info(`§Scanning for the first trade ID for gapno. ${currentGapID}`);
      log.info(currentGap);
    }

    currentId = _.first(data).trade_id;
    log.debug(`Have trade id ${currentId} for date ${_.first(data).time}`);

    let nextScanId = currentId - Math.floor(scanSize);

    if (nextScanId < 0) {
        console.log(scanSize);
        console.log(nextScanId);
        console.log(_.first(data));
        currentGap['firstBatchID'] = 0;
        currentGap['firstBatchTime'] = moment.unix(sinceTs).utc().format();
        // reset gap id for import start
        currentGapID = 0;
        return callback(undefined, undefined);
    }

    setTimeout(() => {
      const fetch = cb => this.gdax_public.getProductTrades(this.pair, { after: nextScanId, limit: 1 }, this.processResponse('getTrades', cb));
      retry(null, fetch, handle);
    }, QUERY_DELAY);
  }

  const fetch = cb => this.gdax_public.getProductTrades(this.pair, { limit: 1 }, this.processResponse('getTrades', cb));
  retry(null, fetch, handle);
}

Fetcher.prototype.findFirstTrade = function(sinceTs, callback) {
  let currentId = 0;
  let sinceM = moment(sinceTs).utc();

  log.info(`Scanning for the first trade ID to start batching requests, may take a few minutes ...`);

  const handle = (err, data) => {
    if (err) return callback(err);

    let m = moment.utc(_.first(data).time);
    let ts = m.valueOf();

    if (ts < sinceTs) {
      log.info(`First trade ID for batching found ${currentId - SCAN_ITER_SIZE}`);
      return callback(undefined, currentId - SCAN_ITER_SIZE);
    }

    currentId = _.first(data).trade_id;
    log.debug(`Have trade id ${currentId} for date ${_.first(data).time} ${sinceM.from(m, true)} to scan`);

    let nextScanId = currentId - SCAN_ITER_SIZE;
    if (nextScanId <= SCAN_ITER_SIZE) {
      currentId = BATCH_ITER_SIZE;
      log.info(`First trade ID for batching found ${currentId}`);
      return callback(undefined, currentId);
    }

    setTimeout(() => {
      const fetch = cb => this.gdax_public.getProductTrades(this.pair, { after: nextScanId, limit: 1 }, this.processResponse('getTrades', cb));
      retry(null, fetch, handle);
    }, QUERY_DELAY);
  }

  const fetch = cb => this.gdax_public.getProductTrades(this.pair, { limit: 1 }, this.processResponse('getTrades', cb));
  retry(null, fetch, handle);
}

util.makeEventEmitter(Fetcher);

let end = false;
let done = false;
let from = false;

let batch = [];
let batchId = false; // Lowest ID for the current a batch

let lastId = false;

let latestId = false;
let latestMoment = false;

let fetcher = new Fetcher(config.watch);

let retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 120 * 1000
};

let fetch = () => {
  fetcher.import = true;

  console.log("lastId for null check =" + lastId); 
  // We are in the sub-iteration step for a given batch
  if (lastId) {
    setTimeout(() => {
      console.log("Last ID before continued fetching = " + lastId);
      fetcher.getTrades(lastId, handleFetch);
    }, QUERY_DELAY);
  }
  // We are running the first query, and need to find the starting batch
  else {
    let process = (err, firstBatchId) => {
      if (err) return handleFetch(err);
      
      if (allGaps.length > 0) { // When gap exists in the imported data
        log.info("Found startBatchID for all gaps");
        console.log(allGaps);
        allGaps = allGaps.reverse();
        log.info("Importing trades for gap id." + currentGapID);
        currentGap = allGaps[currentGapID];
        batchId = currentGap["firstBatchID"];
        fetcher.getTrades(batchId + 1, handleFetch);
      } else {
        batchId = firstBatchId;
        fetcher.getTrades(batchId + 1, handleFetch);
      }
    }

    // check first time finding the gaps in the data
    if (allGaps.length == 0) {
      reader.getAllGaps(from, end, function(gaps) {
        var firstBatchId = 0;
        var err = null;
        //print all gaps
        console.log(allGaps);
  
        if (gaps.length > 0) {
          allGaps = gaps.reverse();
          currentGapID = 0;
          currentGap = allGaps[currentGapID];

          var sinceTs = currentGap['start'];

          log.info(`§Scanning for the first trade ID for gapno. ${currentGapID}`);
          log.info(currentGap);

          fetcher.findFirstTradeIDsForGaps(sinceTs, process);
        } else {
          log.info("No gaps found for this pair");
          fetcher.findFirstTrade(from.valueOf(), process);
        }
      });
    } else {
        console.log("somehow here");
    }
  }
}

let handleFetch = (err, trades) => {
  log.debug("Handling Fetch");
  if (err) {
    log.error(`There was an error importing from GDAX ${err}`);
    fetcher.emit('done');
    return fetcher.emit('trades', []);
  }
    
  let last = null;
  let currentGapStart = null;
  let currentGapEnd = null;

  if (trades.length) {
    batch = trades.concat(batch);
    console.log("batch length = " + batch.length);

    last = moment.unix(_.first(trades).date).utc();
    lastId = _.first(trades).tid

    if (allGaps.length > 0 && currentGap != null) {
        currentGapStart = moment.unix(currentGap['start']).utc();
        currentGapEnd = moment.unix(currentGap['end']).utc();
    }

    let latestTrade = _.last(trades);
    if (!latestId || latestTrade.tid > latestId) {
      latestId = latestTrade.tid;
      latestMoment = moment.unix(latestTrade.date).utc();
    }

    // still doing sub-iteration in the batch
    if (lastId >= (batchId - BATCH_ITER_SIZE) && last >= from) {
      if (allGaps.length > 0 && currentGap != null) {
        console.log("last = " + last.format());
        console.log("last Unix = " + last.unix());
        console.log("currentGapStart  = " + currentGapStart.format());
        console.log("currentGapEnd  = " + currentGapEnd.format());
        // if within gap interval
        if (last <= currentGapEnd) {
          log.info("Still doing sub-iteration in the batch in gap id. " + currentGapID);
          return fetch();
        } else {
        }
      } else {
        console.log("Still doing sub-iteration in the batch (no gap).");
        return fetch();
      }
    }
  }

  console.log("trade length = " + trades.length);
  console.log("last = " + last);
  console.log("last = " + last.unix());
  console.log("currentGapEnd = " + currentGapEnd);

  // set up the new batch id
  if (allGaps.length == 0 || (last != null && last <= currentGapEnd)) { 
    if (allGaps.length == 0) {
      log.info("Importing for the next batch (no gap)");
    } else {
      log.info("Importing for the next batch for current gap id. " + currentGapID);
    }
    batchId += BATCH_ITER_SIZE;
    lastId = batchId + 1;
    console.log("\n batch id = " + batchId);
    console.log("\n last id = " + lastId);
  } else if (currentGapID < allGaps.length) { // when iterating through gap
    log.info("Outside of current gap");
    console.log("Start importing for next gap after increasing the currentGapID." + currentGapID);
    currentGapID += 1;
    currentGap = allGaps[currentGapID];
    console.log(currentGap);
    console.log("Setting the first batch id for the next gap id. " + currentGapID);
    batchId = currentGap['firstBatchID'];
    lastId = batchId + 1;
  }

  if (latestMoment >= end || currentGapID == allGaps.length) {
    fetcher.emit('done');
  }

  let endUnix = end.unix();
  let startUnix = from.unix();
  batch = _.filter(batch, t => t.date >= startUnix && t.date <= endUnix);

  // process trades
  fetcher.emit('trades', batch);
  batch = [];

}

module.exports = function (daterange) {
  from = daterange.from.utc().clone();
  end = daterange.to.utc().clone();

  return {
    bus: fetcher,
    fetch: fetch
  }
}
