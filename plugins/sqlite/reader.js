var moment = require('moment');
var _ = require('lodash');
var util = require('../../core/util.js');
var config = util.getConfig();
var log = require(util.dirs().core + 'log');

var sqlite = require('./handle');
var sqliteUtil = require('./util');

var Reader = function() {
  _.bindAll(this);
  this.db = sqlite.initDB(true);
}

var thisReader = new Reader;


// returns the most recent window complete candle
// windows within `from` and `to`
Reader.prototype.mostRecentWindow = function(from, to, next) {
  to = to.unix();
  from = from.unix();

  var maxAmount = to - from + 1;

  this.db.all(`
    SELECT start from ${sqliteUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from}
    ORDER BY start DESC
  `, function(err, rows) {
    if(err) {

      // bail out if the table does not exist
      if(err.message.split(':')[1] === ' no such table')
        return next(false);

      log.error(err);
      return util.die('DB error while reading mostRecentWindow');
    }

    // no candles are available
    if(rows.length === 0) {
      return next(false);
    }

    if(rows.length === maxAmount) {

      // full history is available!

      return next({
        from: from,
        to: to
      });
    }

    // we have at least one gap, figure out where
    var mostRecent = _.first(rows).start;

    var gapIndex = _.findIndex(rows, function(r, i) {
      return r.start !== mostRecent - i * 60;
    });

    // if there was no gap in the records, but
    // there were not enough records.
    if(gapIndex === -1) {
      var leastRecent = _.last(rows).start;
      return next({
        from: leastRecent,
        to: mostRecent
      });
    }

    // else return mostRecent and the
    // the minute before the gap
    return next({
      from: rows[ gapIndex - 1 ].start,
      to: mostRecent
    });

  })
}

var date = function(t) {
    return moment.unix(t).utc().format();
}

Reader.prototype.findGaps = function(rows, from, to) {
    var gaps = [];
    var mid = (from + to)/2;
    var diff = 60;

    var nm = 0;//flag to figure out gap

    var lastTime = null;
    var lastId = 0;
    if (rows.length >= 1) {
        if (rows[0] != null)
            lastId = rows[0].id
        lastTime = from-diff; // variable to store the gap start
    }
    for(var t=from, i=0; t<=to; t+=diff) {
        var r = null;
        var id = null;
        if (rows[i] == null) {
            if(i+1 !== rows.length) { // last gap
                var gap = {}; 
                gap['lastId'] = lastId;
                gap['start'] = t;
                gap['startDate'] = date(t);
                gap['end'] = to;
                gap['endDate'] = date(to);
                gaps.push(gap);
            }
            break;
        } else {
            r = rows[i].start;
            id = rows[i].id;
        }

        if (r === t) {
            // get the next element in the row
            i += 1;
            lastTime = t;

            if (nm != 0) { // gap ends because start and time matched again, use the current time to determine the end of the gap
                var tt = t - diff; 
                if (gap != null) {
                    gap['end'] = tt;
                    gap['endDate'] = date(tt);
                    gaps.push(gap);
                }
            }
            nm = 0;
        } else {

            if (nm == 0) { // start and time did not match, therefore gap exists, use the last available time to determine the start of the gap
                var tt = lastTime + diff; 
                var gap = {}; 
                gap['lastId'] = lastId;
                gap['start'] = tt;
                gap['startDate'] = date(tt);
            }

            nm += 1;
        }
        lastId = id;
    }
    return(gaps);
}

// returns the most recent window complete candle
// windows within `from` and `to`
Reader.prototype.getAllGaps = function(from, to, next) {
  to = to.unix();
  from = from.unix();

  var maxAmount = to - from + 1;

  this.db.all(`
    SELECT id, start from ${sqliteUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from} ORDER BY start ASC
  `, function(err, rows) {
    if(err) {

      // bail out if the table does not exist
      if(err.message.split(':')[1] === ' no such table')
        return next(false);

      log.error(err);
      return util.die('DB error while reading mostRecentWindow');
    }

    // no candles are available
    if(rows.length === 0) {
      return next(false);
    }

    log.debug("Finding Gaps");
    log.debug("Total rows = " + rows.length);
    log.debug("from = " + moment.unix(from).utc().format('Z'));
    log.debug("to = " + moment.unix(to).utc().format('Z'));
    var gaps = thisReader.findGaps(rows, from, to);
    if (gaps.length >= 0) {
        log.debug("Found Gaps:");
        log.debug(gaps);
    } else {
        log.debug("No Gaps.");
    }
    next(gaps)

    return(gaps);
  })
}


Reader.prototype.tableExists = function(name, next) {

  this.db.all(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='${sqliteUtil.table(name)}';
  `, function(err, rows) {
    if(err) {
      console.error(err);
      return util.die('DB error at `get`');
    }

    next(null, rows.length === 1);
  });
}

Reader.prototype.get = function(from, to, what, next) {
  if(what === 'full')
    what = '*';

  this.db.all(`
    SELECT ${what} from ${sqliteUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from}
    ORDER BY start ASC
  `, function(err, rows) {
    if(err) {
      console.error(err);
      return util.die('DB error at `get`');
    }

    next(null, rows);
  });
}

Reader.prototype.count = function(from, to, next) {
  this.db.all(`
    SELECT COUNT(*) as count from ${sqliteUtil.table('candles')}
    WHERE start <= ${to} AND start >= ${from}
  `, function(err, res) {
    if(err) {
      console.error(err);
      return util.die('DB error at `get`');
    }

    next(null, _.first(res).count);
  });
}

Reader.prototype.countTotal = function(next) {
  this.db.all(`
    SELECT COUNT(*) as count from ${sqliteUtil.table('candles')}
  `, function(err, res) {
    if(err) {
      console.error(err);
      return util.die('DB error at `get`');
    }

    next(null, _.first(res).count);
  });
}

Reader.prototype.getBoundry = function(next) {

  this.db.all(`
    SELECT
    (
      SELECT start
      FROM ${sqliteUtil.table('candles')}
      ORDER BY start LIMIT 1
    ) as 'first',
    (
      SELECT start
      FROM ${sqliteUtil.table('candles')}
      ORDER BY start DESC
      LIMIT 1
    ) as 'last'
  `, function(err, rows) {
    if(err) {
      console.error(err);
      return util.die('DB error at `get`');
    }

    next(null, _.first(rows));
  });
}

Reader.prototype.close = function() {
  this.db.close();
  this.db = null;
}

module.exports = Reader;
