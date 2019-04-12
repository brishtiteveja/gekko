const gekkoPath = require('./src/isWindows.js')
    ? 'C:\\path\\to\\gekko\\gekko'
    : "/home/ubuntu/gekko/gekko";

const importer = require("./src/importer");
importer.run(gekkoPath);
