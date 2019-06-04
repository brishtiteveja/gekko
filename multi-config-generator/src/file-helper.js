const configDirPath = "configs";//Where to generate all configs
const path = require('path');
var util = require('util');
var fs = require('fs-extra');


const fileHelper = (() => {
    const fileParts = (obj) => {
	const filename = null;
   	if (obj.strategy != null)	
           fileName = `${obj.currency}-${obj.asset}-${obj.strategy}.${obj.exchange.substring(0, 3)}`;
	else if (obj.exchange != null) { 
           fileName = `${obj.currency}-${obj.asset}.${obj.exchange.substring(0, 3)}`;
	} else {
           fileName = `${obj.currency}-${obj.asset}`;
	}
        const scriptKey = `${configDirPath}/${obj.currency.toUpperCase()}/${fileName}`;
        const filePath = `${scriptKey}.js`;
        return {
            fileName: fileName,
            scriptKey: scriptKey,
            filePath: filePath
        }
    }

    const fileNames = (dir) => {
        const files = allFiles(dir);
        const filesWithFwSlash = files.map(f => f.replace(/\\/g, "/"));//Fixes Windows \ slashes for path
        return filesWithFwSlash.filter(x => x.split("/")[2]).map(f => {
            const fileParts = f.split("/")[2].split(".");
            const fileName = `${fileParts[0]}.${fileParts[1]}`;
            return {
                fullPath: f,
                fileName: fileName
            };
        });
    }
    const allFiles = (dir) => {
        return fs.statSync(dir).isDirectory()
            ? Array.prototype.concat(...fs.readdirSync(dir).map(f => allFiles(path.join(dir, f))))
            : dir;
    }
    const writeNodeModule = (filePath, content) => {
        fs.ensureFileSync(filePath);
        const exportLine = "module.exports = config;";
        const jsFileContent = 'var config = ' + util.inspect(content) + '\n' + exportLine;
        fs.writeFileSync(filePath, jsFileContent, 'utf-8')
    }
    const writeJson = (filePath, content) => {
        try {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            return true;
        } catch (e) {
            return false;
        }
    }
    return {
        fileParts: fileParts,
        fileNames: fileNames,
        writeNodeModule: writeNodeModule,
        writeJson: writeJson
    }
})();
module.exports = fileHelper;
