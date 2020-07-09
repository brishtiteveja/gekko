var program = require('commander');

if (process.argv.length == 8) {
    process.argv[4] = process.argv[4] + " " + process.argv[5];
    process.argv[5] = process.argv[6] + " " + process.argv[7];
    process.argv.length = 6;
}

program
  .option('-e, --exchange', 'Name of exchange to import from')
  .option('-c, --currency', 'Name of currency/market')
  .option('-a, --asset', 'Name of asset/coin')
  .option('-f, --from', 'Starting date for import')
  .option('-t, --to', 'Ending date for import')
  .parse(process.argv);

const gekkoPath = require('./src/isWindows.js')
    ? 'C:\\path\\to\\gekko\\gekko'
    : "/home/ubuntu/gekko/gekko";

const importer = require("./src/importer");
importer.runAll(gekkoPath, program);
