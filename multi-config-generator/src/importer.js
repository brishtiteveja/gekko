const CONFIGS_DIR_DEST_PATH = "./configs";
const MARKETS_CONFIG_PATH = "../../exchange/wrappers";

var util = require('../../core/util');
var program = require('commander')
var fs = require('fs-extra');

const fileHelper = require("./file-helper");
const packageJson = './package.json';
const pairConfig = require(`${CONFIGS_DIR_DEST_PATH}/pair-config`).module;
const exchangeConfig = require(`${CONFIGS_DIR_DEST_PATH}/exchange-config`).module;

var gekkoPath;

program
  .version(util.logVersion())
  .option('-e, --exchange <exchange name>', 'Name of the exchange')
  .option('-f, --from', 'import from')
  .option('-t, --to', 'impor to')
  .parse(process.argv);

const importer = ({
    getPackageJsonContent() {
        return JSON.parse(fs.readFileSync(packageJson));
    },
    getScriptsTag() {
        return this.getPackageJsonContent()["scripts"];
    },
    cleanScriptsTag() {
        //Remove previous generated run scripts
        const scripts = this.getScriptsTag();
        Object.keys(scripts).forEach(key => {
            const scriptVal = scripts[key];
            if (scriptVal.indexOf("gekko") >= 0 && scriptVal.indexOf("--ui") === -1) delete scripts[key];
        });
        scripts["run-all"] = "";
        return scripts;
    },
    updatePackageJsonScripts(scripts) {
        var packageJsonContent = this.getPackageJsonContent();
        packageJsonContent["scripts"] = scripts;
        return fileHelper.writeJson(packageJson, packageJsonContent);
    },
    getBaseConfig() {
        const baseConfig = require(`${CONFIGS_DIR_DEST_PATH}/base-importer-config.js`);
        const config = {...baseConfig};
        return config;
    },
    setScriptsProp(scripts, watchProp) {
        const {filePath, fileName} = fileHelper.fileParts(watchProp);
        const relPath = process.cwd().replace(/\s/g, "\\ ");
        const scriptValue = `node ${gekkoPath} --config ${relPath}/${filePath}`;
        scripts[fileName] = scriptValue;
    },
    writeCurrencyConfig(config, watchProp) {
        const {filePath} = fileHelper.fileParts(watchProp);
        fileHelper.writeNodeModule(filePath, config);
    },
    cleanStrategies(config, currentStrategy) {
        var newConfig = {...config};//make a copy to be able to remove all other
        return newConfig;
    },
    generateConfigs() {
        var _config = this.getBaseConfig();

	console.log(program["config"]);
	console.log(program.from);
	console.log(program.to);

        Object.keys(pairConfig).forEach(exchangeKey => {
            const exchange = pairConfig[exchangeKey];
            exchange.pairs.forEach(watchProp => {
		watchProp.exchange = exchangeKey;
                let {strategies, ...watch} = watchProp;//Ommit strategies
		_config.watch = watch;
                this.writeCurrencyConfig(_config, watchProp);
            });
        });


        return _config;
    },
    generateAllConfigs() {
        var _config = this.getBaseConfig();

	console.log(progam);

	exchangeConfig.exchanges.forEach(exchange => {
	    const marketData = require(`${MARKETS_CONFIG_PATH}/binance-markets.json`);
	    marketData.markets.forEach(market => {
	    	_config.watch.exchange =  exchange;
		_config.watch.asset = market.pair[0];
		_config.watch.currency = market.pair[1];
		let watchProp = _config.watch; 
		//console.log("Writing importer config file for : ");
		//console.log(watchProp);

                this.writeCurrencyConfig(_config, watchProp);
       	    });

	});

        return _config;
    },
    setRunAllScriptsCommand(scripts) {
        var runAllCommand = `npm-run-all --parallel `;
        const configFiles = this.getConfigFilesSorted(CONFIGS_DIR_DEST_PATH);
        configFiles.forEach(file => {
            runAllCommand += `${file.fileName} `;
        });
        scripts["run-all"] = runAllCommand.trim();
    },
    getRunScripts() {
        const _config = this.getBaseConfig();
        const scripts = this.cleanScriptsTag();

        //TODO: merge with generateConfigs()
        Object.keys(pairConfig).forEach(exchangeKey => {
            const exchange = pairConfig[exchangeKey];
            exchange.pairs.forEach(watchProp => {
                _config.watch = watchProp;
                delete _config[watchProp.exchange];//Remove api keys under exchange name
		this.setScriptsProp(scripts, watchProp);
            });
        });
        this.setRunAllScriptsCommand(scripts);
        return scripts;
    },
    getConfigFilesSorted(dirPath) {
        const configFiles = fileHelper.fileNames(dirPath).sort((a, b) => {
            const aName = a.fileName.split("-")[1].split(".")[0];
            const bName = b.fileName.split("-")[1].split(".")[0];
            return aName.localeCompare(bName);
        });
        return configFiles;
    },
    run(gekko) {
        gekkoPath = gekko;
        this.generateConfigs();
        const runScripts = this.getRunScripts();
        this.updatePackageJsonScripts(runScripts);
    },
    runAll(gekko) {
        gekkoPath = gekko;
        this.generateAllConfigs();
        const runScripts = this.getRunScripts();
        this.updatePackageJsonScripts(runScripts);
    }
});
module.exports = importer;
