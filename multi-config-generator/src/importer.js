const CONFIGS_DIR_DEST_PATH = "./configs";
const MARKETS_CONFIG_PATH = "../../exchange/wrappers";

var fs = require('fs-extra');

const fileHelper = require("./file-helper");
const packageJson = './package.json';
const pairConfig = require(`${CONFIGS_DIR_DEST_PATH}/pair-config`).module;
const exchangeConfig = require(`${CONFIGS_DIR_DEST_PATH}/exchange-config`).module;

var gekkoPath;

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
    generateAllConfigs(exchangeName, asset, currency, from, to) {
        var _config = this.getBaseConfig();

        // set the date range
        _config.importer.daterange.from = from;
        _config.importer.daterange.to = to;

        if (exchangeName == null) { // Do for all exchanges 
	        exchangeConfig.exchanges.forEach(exchange => {
                var marketDataFile = MARKETS_CONFIG_PATH + "/" + exchange + "-markets.json"; 
	            const marketData = require(marketDataFile);
                if (asset != null && currency != null) {
	    	       _config.watch.exchange =  exchange;
		           _config.watch.asset = asset;
		           _config.watch.currency = currency;
		           let watchProp = _config.watch; 

                   this.writeCurrencyConfig(_config, watchProp);
                } else { // write config for all pairs
	                marketData.markets.forEach(market => {
	    	            _config.watch.exchange =  exchange;
		                _config.watch.asset = market.pair[0];
		                _config.watch.currency = market.pair[1];
		                let watchProp = _config.watch; 

                        this.writeCurrencyConfig(_config, watchProp);
       	            });
                }
            });
        } else { // write config file for only this exchange
            exchange = exchangeName;
            var marketDataFile = MARKETS_CONFIG_PATH + "/" + exchange + "-markets.json"; 
	        const marketData = require(marketDataFile);
            if (asset != null && currency != null) {
	           _config.watch.exchange =  exchange;
		       _config.watch.asset = asset;
		       _config.watch.currency = currency;
		       let watchProp = _config.watch; 

               this.writeCurrencyConfig(_config, watchProp);
            } else { // write config for all pairs
	           marketData.markets.forEach(market => {
	               _config.watch.exchange =  exchange;
		           _config.watch.asset = market.pair[0];
		           _config.watch.currency = market.pair[1];
		           let watchProp = _config.watch; 

                   this.writeCurrencyConfig(_config, watchProp);
       	       });
           }
        }

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
    getRunAllScripts(exchangeName, asset, currency) {
        const _config = this.getBaseConfig();
        const scripts = this.cleanScriptsTag();

        if (exchangeName == null) { // Do for all exchanges 
	        exchangeConfig.exchanges.forEach(exchange => {
                var marketDataFile = MARKETS_CONFIG_PATH + "/" + exchange + "-markets.json"; 
	            const marketData = require(marketDataFile);
                if (asset != null && currency != null) {
	    	       _config.watch.exchange =  exchange;
		           _config.watch.asset = asset;
		           _config.watch.currency = currency;
		           let watchProp = _config.watch; 

		           this.setScriptsProp(scripts, watchProp);
                } else { // write config for all pairs
	                marketData.markets.forEach(market => {
	    	            _config.watch.exchange =  exchange;
		                _config.watch.asset = market.pair[0];
		                _config.watch.currency = market.pair[1];
		                let watchProp = _config.watch; 

		                this.setScriptsProp(scripts, watchProp);
       	            });
                }
            });
        } else { // write config file for only this exchange
            exchange = exchangeName;
            var marketDataFile = MARKETS_CONFIG_PATH + "/" + exchange + "-markets.json"; 
	        const marketData = require(marketDataFile);
            if (asset != null && currency != null) {
	           _config.watch.exchange =  exchange;
		       _config.watch.asset = asset;
		       _config.watch.currency = currency;
		       let watchProp = _config.watch; 

		       this.setScriptsProp(scripts, watchProp);
            } else { // write config for all pairs
	           marketData.markets.forEach(market => {
	               _config.watch.exchange =  exchange;
		           _config.watch.asset = market.pair[0];
		           _config.watch.currency = market.pair[1];
		           let watchProp = _config.watch; 

		           this.setScriptsProp(scripts, watchProp);
       	       });
           }
        }

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
    isValidExchange(e) {
        var isValid = false;
        exchangeConfig.exchanges.forEach(exchange => {
            if(e === exchange) { 
                isValid = true;
            }
        });
        
        return isValid;
    },
    isValidAssetCurrencyPair(exchange, asset, currency) {

        return true;
    },
    isDate(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    },
    isValidDate(obj) {
        obj = new Date(obj);
        return this.isDate(obj) && !isNaN(obj.getTime());
    },
    getTimeMonthsAgo(diff) {
        var now, yyyy, mm, dd, hh, mn, ss, ct;
        now = new Date(); 
        yyyy = now.getUTCFullYear();
        mm = now.getUTCMonth() + 1 - diff;
        dd = now.getUTCDate();


        hh = now.getUTCHours(); 
        mn = now.getUTCMinutes();
        ss = now.getUTCSeconds(); 

        // Make two digit
        if(dd<10) dd='0'+dd;
        if(mm<10) mm='0'+mm;
        if(hh<10) hh='0'+hh;
        if(mn<10) mn='0'+mn;
        if(ss<10) ss='0'+ss;

        cdt = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mn + ":" + ss;

        return cdt;
    },
    getCurrentTime() {
        var now, yyyy, mm, dd, hh, mn, ss, ct;
        now = new Date(); 
        yyyy = now.getUTCFullYear();
        mm = now.getUTCMonth() + 1;
        dd = now.getUTCDate();


        hh = now.getUTCHours(); 
        mn = now.getUTCMinutes();
        ss = now.getUTCSeconds(); 

        // Make two digit
        if(dd<10) dd='0'+dd;
        if(mm<10) mm='0'+mm;
        if(hh<10) hh='0'+hh;
        if(mn<10) mn='0'+mn;
        if(ss<10) ss='0'+ss;

        ct = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mn + ":" + ss;

        return ct;
    },
    runAll(gekko, program) {
        gekkoPath = gekko;
        var runScripts = null;
	    if(program.args.length > 0) {
	        console.log(program.args);

            var exchange = null;
            var from = null;
            var to = null;
            var asset = null;
            var currency = null;
            if (program.args.length == 5) {
                exchange = program.args[0];
                if(!this.isValidExchange(exchange)) {
                    console.log("Exchange name is not valid");
                    return;
                }
                asset = program.args[1];
                currency = program.args[2];

                if(!this.isValidAssetCurrencyPair(exchange, asset, currency)) {
                    console.log("Asset currency pair " + asset + "-" + currency + " for exchange " + exchange + " is not valid");
                    return;
                }

                from = program.args[3];
                to = program.args[4];
                if (to === 'now')
                    to = this.getCurrentTime();

                if (!this.isValidDate(from)) {
                   console.log("Daterange from is not valid");
                   return;
                }
                if (!this.isValidDate(to)) {
                   console.log("Daterange to is not valid");
                   return;
                }
                console.log("Condition 0-0");
                console.log("Generate config for this pair for this exchange in the given daterange");
                // Example 1: npm run import -e binance -a BNB -c BTC -f 2014-01-01 -t 2014-03-01
                // Example 2: npm run import -e binance -a ETH -c BTC -f "2014-01-01 09:12:32" -t "2014-03-01 07:12:45"

                this.generateAllConfigs(exchange, asset, currency, from, to);
            
            } else if (program.args.length == 4) {
                exchange = program.args[0];
                if(this.isValidExchange(exchange)) {
                    console.log("Exchange name should not be specified.");
                    return;
                }
                exchange = null;
                asset = program.args[0];
                currency = program.args[1];

                if(!this.isValidAssetCurrencyPair(exchange, asset, currency)) {
                    console.log("Asset currency pair " + asset + "-" + currency + " for exchange " + exchange + " is not valid");
                    return;
                }

                from = program.args[2];
                to = program.args[3];
                if (to === 'now')
                    to = this.getCurrentTime();

                if (!this.isValidDate(from)) {
                   console.log("Daterange from is not valid");
                   return;
                }
                if (!this.isValidDate(to)) {
                   console.log("Daterange to is not valid");
                   return;
                }
                console.log("Condition 0-1");
                console.log("Generate config for this pair for all exchanges in the given daterange");
                // Example: node import -a ETH -c BTC -f "2019-01-01" -t "2019-03-01"
                //
                this.generateAllConfigs(exchange, asset, currency, from, to);
            } else if(program.args.length == 3) { // Cond 1: exchange, from and to date given
                exchange = program.args[0];
                if(this.isValidExchange(exchange) == false) {
                    console.log("Exchange name is not valid");
                    return;
                }
                from = program.args[1];
                to = program.args[2];
                if (to === 'now')
                    to = this.getCurrentTime();

                if (!this.isValidDate(from)) {
                   console.log("Daterange from is not valid");
                   return;
                }
                if (!this.isValidDate(to)) {
                   console.log("Daterange to is not valid");
                   return;
                }
                console.log("Condition 1");
                console.log("Generate config for all pairs for this exchange in the given daterange");
                // Example 1: npm run import -e binance -f 2014-01-01 -t 2014-03-01
                // Example 2: npm run import -e binance -f "2014-01-01 09:12:32" -t "2014-03-01 07:12:45"

                this.generateAllConfigs(exchange, asset, currency, from, to);
            } else if (program.args.length == 2) { 
                exchange = program.args[0];             
                if(this.isValidExchange(exchange)) {
                    if (program.args[1] === 'now') {
                        console.log("Condition 2"); // Cond 2
                        console.log("Generate configs for this exchange and available pairs for last 3 months");
                        // Example: npm run import -e binance -t now
                        var diff = 3;
                        from = this.getTimeMonthsAgo(diff);
                        to = this.getCurrentTime();
                    } else {
                        from = program.args[1];
                        if(this.isValidDate(from)) {
                            console.log("Condition 3"); // Cond 3
                            console.log("Generate configs for this exchanges from daterange from till now.");
                            // Example: npm run import -e binance -f 2014-01-01
                            to = this.getCurrentTime();
                            this.generateAllConfigs(exchange, asset, currency, from, to);
                        } else {
                            console.log("Daterange from or to is not valid");
                            return;
                        }
                    }
                } else {
                    from = program.args[0];
                    if(this.isValidDate(from)) {
                        console.log("Condition 3-1"); // Cond 3-1
                        console.log("Generate configs for all exchanges from daterange from till now.");
                        // Example-1: npm run import -f 2014-01-01 -t 2014-03-03
                        // Example: npm run import -f 2014-01-01 -t now 
                        to = program.args[1];
                        if (to === 'now')
                            to = this.getCurrentTime();
                        else if (!this.isValidDate(to)) {
                            console.log("Daterange to is not valid");
                            return;
                        } 
                        exchange = null;
                        this.generateAllConfigs(exchange, asset, currency, from, to);
                    } else {
                        console.log("Exchange name is not valid");
                        return;
                    }
                }
            } else if (program.args.length == 1) { 
                    if (program.args[0] === 'all' || program.args[0] === "now") {
                        // Example 1: npm run import all  
                        // Example 2: npm run import -t now
                        console.log("Condition 4"); // Cond 4: Only from date is given
                        console.log("Generate configs for all exchanges and available pairs for last 3 months");
                        var diff = 3;
                        from = this.getTimeMonthsAgo(diff);
                        to = this.getCurrentTime();
                        console.log(from);
                        console.log(to);
                        this.generateAllConfigs(exchange, asset, currency, from, to);
                    } else { 
                        from = program.args[0];
                        if(this.isValidDate(from)) {
                            // Cond 5: Generate configs for all exchanges from daterange_from till now
                            // Example: npm run import -f 2014-01-01
                            console.log("Condition 5");
                            console.log("Generate configs for all exchanges from daterange_from till now.");
                            console.log(from)
                            to = this.getCurrentTime();
                            console.log(to); 

                            this.generateAllConfigs(exchange, asset, currency, from, to);
                        } else {
                            exchange = program.args[0];
                            if (this.isValidExchange(exchange)) {
                                console.log("Condition 6");
                                // Example: npm run import -e binance
                                console.log(exchange); 
                                console.log("Generate configs for this specific exchange and available pairs for last 3 months");
                                var diff = 3;
                                from = this.getTimeMonthsAgo(diff);
                                to = this.getCurrentTime();
                                console.log(from);
                                console.log(to);
                                this.generateAllConfigs(exchange, asset, currency, from, to);
                            } else {
                                console.log("Exchange name or daterange from is not valid");
                            }
                            return;
                        }
                    }
            } else { // exchange, from, to invalid
                console.log("Invalid import argument");
            }

            runScripts = this.getRunAllScripts(exchange, asset, currency);
	    } else { // Cond 7: No condition given
            // Example: npm run import 
            console.log("Condition 7");
            console.log('Generating config files for the pairs specified in the pair-configs.js');
            this.generateConfigs();
            runScripts = this.getRunScripts();
        }
            
        if (runScripts != null)
            this.updatePackageJsonScripts(runScripts);
	}
});
module.exports = importer;
