var program = require('commander');

program
  .option('-e, --exchange', 'Name of exchange to import from')
  .option('-a, --asset', 'Name of asset/market')
  .option('-c, --currency', 'Name of currency')
  .option('-f, --from', 'Starting date for import')
  .option('-t, --to', 'Ending date for import')
  .parse(process.argv);

const gekkoPath = require('./src/isWindows.js')
    ? 'C:\\path\\to\\gekko\\gekko'
    : "/home/ubuntu/gekko/gekko";

const importer = require("./src/importer");
importer.runAll(gekkoPath, program);
