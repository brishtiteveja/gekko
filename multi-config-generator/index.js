const gekkoPath = require('./src/isWindows.js')
    ? 'C:\\path\\to\\gekko\\gekko'
    : "/home/ubuntu/gekko/gekko";

const generator = require("./src/generator");
generator.run(gekkoPath);
