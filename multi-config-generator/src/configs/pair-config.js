const pairConfig = {
    gdax: {
        trader: {
            enabled: false,
            key: '',
            secret: '',
            passphrase: '',
            orderUpdateDelay: 1, // Number of minutes to adjust unfilled order prices
        },
        pairs: [
            {
                strategies: ["BBRSI"],
                currency: "BTC",
                asset: "ETH",
            },
            {
                strategies: ["BBRSI"],//Multiple strategies
                currency: "BTC",
                asset: "BCH",
            }
        ]
    },
    binance: {
        trader: {
            enabled: false,
            key: '',
            secret: '',
            orderUpdateDelay: 1, // Number of minutes to adjust unfilled order prices
        },
        pairs: [
            {
                strategies: ["BBRSI"],
                currency: "BTC",
                asset: "ETH",
            },
            {
                strategies: ["BBRSI"],
                currency: "ETH",
                asset: "ADA",
            }
        ]
    }
}
exports.module = pairConfig;
