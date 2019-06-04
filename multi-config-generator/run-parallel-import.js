var Promise = require('promise');
var parallelLimit = require('run-parallel-limit')
const generator = require("./src/generator");

var packageJsonContent = generator.getPackageJsonContent();
scripts = packageJsonContent["scripts"];
keys = Object.keys(scripts).slice(10, scripts.length);

var importer_commands = [];
for (var i=0; i<keys.length; i++) {
    cmd = scripts[keys[i]];
    out = cmd.split(" ")[3] + '.out'
    fcmd = cmd + ' > ' + out + ' 2>&1'
    importer_commands.push(fcmd);
}

const exec = require('child_process').exec;
var execute = function(command, index, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

const execSync = require('child_process').execSync;
var executeSync = function(command, index, callback){
    execSync(command, function(error, stdout, stderr){ callback(stdout); });
};

function execPromise(cmd) {
     return new Promise((resolve, reject) => {
           exec(cmd, (error, stdout, stderr) => {
                  if (error) {
                    reject(error);
                  }
                  resolve(stdout? stdout : stderr);
                 });
          });
}

function execSyncPromise(cmd) {
     return new Promise((resolve, reject) => {
           execSync(cmd, (error, stdout, stderr) => {
                  if (error) {
                    reject(error);
                  }
                  resolve(stdout? stdout : stderr);
                 });
          });
}


var batch_size = 5;
var batch_no = 0;
var promiseChain = Promise.resolve();

//for(var i=0; i<importer_commands.length; i+=batch_size) {
for(var i=0; i<30; i+=batch_size) {
    promiseChain = promiseChain.then(function() {
        Promise.all(
            importer_commands.
                slice(i, i+= batch_size).
                    map(function(cmd, ci) {
                        return cmd;
                    })).then(function(cmd) {
                        var n = cmd.length;
                        var batch_cmd = ""
                        cmd.map(function(c, i) {
                            if (i+1 != n) {
                                batch_cmd += c + " & ";
                            } else {
                                batch_cmd += c;
                            }
                        });
                        batch_no++;
                        console.log("Import for batch No. " + batch_no + " running.");
                        console.log(batch_cmd);
                        console.log("-----------------------------------------");

                        execSyncPromise(batch_cmd);
                })
    });
}

promiseChain.then(function() { console.log('done') });
   
            
