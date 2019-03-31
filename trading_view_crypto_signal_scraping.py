import requests, json, time, datetime
import sys

# rating
# buy/sell signal on trading view: https://blog.tradingview.com/en/ratings-now-available-stock-screener-4031/

def make_payload(exchange, market):
        all_columns = ["name","change","Perf.W","Perf.1M","Perf.3M","Perf.6M","Perf.YTD","Perf.Y","Volatility.D","exchange","CCI20","DonchCh20.Lower","DonchCh20.Upper","EMA10","EMA100","EMA20","High.1M","Low.1M","Pivot.M.Camarilla.Middle","Pivot.M.Camarilla.R1","Pivot.M.Camarilla.R2","Pivot.M.Camarilla.R3","Pivot.M.Camarilla.S1","Pivot.M.Camarilla.S2","Pivot.M.Camarilla.S3","Pivot.M.Classic.Middle","Pivot.M.Classic.R1","Pivot.M.Classic.R2","Pivot.M.Classic.R3","Pivot.M.Classic.S1","Pivot.M.Classic.S2","Pivot.M.Classic.S3","Pivot.M.Demark.Middle","Pivot.M.Demark.R1","Pivot.M.Demark.S1","Pivot.M.Fibonacci.Middle","Pivot.M.Fibonacci.R1","Pivot.M.Fibonacci.R2","Pivot.M.Fibonacci.R3","Pivot.M.Fibonacci.S1","Pivot.M.Fibonacci.S2","Pivot.M.Fibonacci.S3","Pivot.M.Woodie.Middle","Pivot.M.Woodie.R1","Pivot.M.Woodie.R2","Pivot.M.Woodie.R3","Pivot.M.Woodie.S1","Pivot.M.Woodie.S2","Pivot.M.Woodie.S3","High.3M","Low.3M","price_52_week_high","price_52_week_low","High.6M","Low.6M","High.All","Low.All","Aroon.Down","Aroon.Up","ask","total_shares_outstanding","ADR","ADX","ATR","average_volume_10d_calc","average_volume_30d_calc","average_volume_60d_calc","average_volume_90d_calc","AO","bid","BB.lower","BB.upper","BBPower","change_abs","change_abs|15","change|15","change_abs|60","change|60","change_abs|1","change|1","change_abs|240","change|240","change_abs|5","change|5","change_from_open_abs","change_from_open","EMA200","EMA30","EMA50","market_cap_diluted_calc","high","HullMA9","Ichimoku.BLine","Ichimoku.CLine","Ichimoku.Lead1","Ichimoku.Lead2","KltChnl.lower","KltChnl.upper","close","low","MACD.macd","MACD.signal","market_cap_calc","Mom","Recommend.MA","ADX-DI","open","Recommend.Other","P.SAR","name","ADX DI","ROC","Recommend.All","EMA5","RSI","RSI7","relative_volume_10d_calc","SMA10","SMA100","SMA20","SMA200","SMA30","SMA5","SMA50","Stoch.D","Stoch.K","Stoch.RSI.K","Stoch.RSI.D","total_shares_diluted","total_value_traded","UO","Volatility.M","Volatility.W","volume","VWMA","W.R","description","name","subtype","CCI20","CCI20[1]","EMA10","close","EMA100","EMA20","pricescale","minmov","fractional","minmove2","ADX","ADX DI","ADX-DI","ADX DI[1]","ADX-DI[1]","AO","AO[1]","BB.lower","BB.upper","Rec.BBPower","EMA200","EMA30","EMA50","Rec.HullMA9","Rec.Ichimoku","MACD.macd","MACD.signal","Mom","Mom[1]","P.SAR","open","Candle.AbandonedBaby.Bearish","Candle.AbandonedBaby.Bullish","Candle.Engulfing.Bearish","Candle.Harami.Bearish","Candle.Engulfing.Bullish","Candle.Harami.Bullish","Candle.Doji","Candle.Doji.Dragonfly","Candle.EveningStar","Candle.Doji.Gravestone","Candle.Hammer","Candle.HangingMan","Candle.InvertedHammer","Candle.Kicking.Bearish","Candle.Kicking.Bullish","Candle.LongShadow.Lower","Candle.LongShadow.Upper","Candle.Marubozu.Black","Candle.Marubozu.White","Candle.MorningStar","Candle.ShootingStar","Candle.SpinningTop.Black","Candle.SpinningTop.White","Candle.3BlackCrows","Candle.3WhiteSoldiers","Candle.TriStar.Bearish","Candle.TriStar.Bullish","EMA5","RSI"] 
        
        all_columns += ["RSI[1]","RSI7","RSI7[1]","SMA10","SMA100","SMA20","SMA200","SMA30","SMA5","SMA50","Stoch.K","Stoch.D","Stoch.K[1]","Stoch.D[1]","Rec.Stoch.RSI","Rec.UO","Rec.VWMA","Rec.WR"]
        
        formatted_columns = []
        for i, c in enumerate(all_columns):
            if "|" not in c:
                c = "{}|{}".format(c, candle)
                formatted_columns.append(c)

	# some columns don't give results 
        final_columns = formatted_columns[20:59]
        final_columns += formatted_columns[61:69]
        final_columns += formatted_columns[70:79]
        final_columns += formatted_columns[80:89]
        final_columns += formatted_columns[93:99]
        print(len(final_columns))


        payload = {
                    "symbols": {
                        "tickers": ["{}:{}".format(exchange, market)],
                        "query": { "types": [] }
                    },
                    "columns": 
                    [
                        "open|{}".format(candle),
                        "high|{}".format(candle),
                        "low|{}".format(candle),
                        "close|{}".format(candle),
                        "volume|{}".format(candle),
                        "ROC|{}".format(candle),
                        "Recommend.Other|{}".format(candle),
                        "Recommend.All|{}".format(candle),
                        "Recommend.MA|{}".format(candle),
                        "RSI|{}".format(candle),
                        "RSI[1]|{}".format(candle),
                        "Stoch.K|{}".format(candle),
                        "Stoch.D|{}".format(candle),
                        "Stoch.K[1]|{}".format(candle),
                        "Stoch.D[1]|{}".format(candle),
                        "CCI20|{}".format(candle),
                        "CCI20[1]|{}".format(candle),
                        "ADX|{}".format(candle),
                        "ADX+DI|{}".format(candle),
                        "ADX-DI|{}".format(candle),
                        "ADX+DI[1]|{}".format(candle),
                        "ADX-DI[1]|{}".format(candle),
                        "AO|{}".format(candle),
                        "AO[1]|{}".format(candle),
                        "Mom|{}".format(candle),
                        "Mom[1]|{}".format(candle),
                        "MACD.macd|{}".format(candle),
                        "MACD.signal|{}".format(candle),
                        "Rec.Stoch.RSI|{}".format(candle),
                        "Stoch.RSI.K|{}".format(candle),
                        "Rec.WR|{}".format(candle),
                        "W.R|{}".format(candle),
                        "Rec.BBPower|{}".format(candle),
                        "BBPower|{}".format(candle),
                        "Rec.UO|{}".format(candle),
                        "UO|{}".format(candle),
                        "EMA10|{}".format(candle),
                        "close|{}".format(candle),
                        "SMA10|{}".format(candle),
                        "EMA20|{}".format(candle),
                        "SMA20|{}".format(candle),
                        "EMA30|{}".format(candle),
                        "SMA30|{}".format(candle),
                        "EMA50|{}".format(candle),
                        "SMA50|{}".format(candle),
                        "EMA100|{}".format(candle),
                        "SMA100|{}".format(candle),
                        "EMA200|{}".format(candle),
                        "SMA200|{}".format(candle),
                        "Rec.Ichimoku|{}".format(candle),
                        "Ichimoku.BLine|{}".format(candle),
                        "Rec.VWMA|{}".format(candle),
                        "VWMA|{}".format(candle),
                        "Rec.HullMA9|{}".format(candle),
                        "HullMA9|{}".format(candle),
                        "Pivot.M.Classic.S3|{}".format(candle),
                        "Pivot.M.Classic.S2|{}".format(candle),
                        "Pivot.M.Classic.S1|{}".format(candle),
                        "Pivot.M.Classic.Middle|{}".format(candle),
                        "Pivot.M.Classic.R1|{}".format(candle),
                        "Pivot.M.Classic.R2|{}".format(candle),
                        "Pivot.M.Classic.R3|{}".format(candle),
                        "Pivot.M.Fibonacci.S3|{}".format(candle),
                        "Pivot.M.Fibonacci.S2|{}".format(candle),
                        "Pivot.M.Fibonacci.S1|{}".format(candle),
                        "Pivot.M.Fibonacci.Middle|{}".format(candle),
                        "Pivot.M.Fibonacci.R1|{}".format(candle),
                        "Pivot.M.Fibonacci.R2|{}".format(candle),
                        "Pivot.M.Fibonacci.R3|{}".format(candle),
                        "Pivot.M.Camarilla.S3|{}".format(candle),
                        "Pivot.M.Camarilla.S2|{}".format(candle),
                        "Pivot.M.Camarilla.S1|{}".format(candle),
                        "Pivot.M.Camarilla.Middle|{}".format(candle),
                        "Pivot.M.Camarilla.R1|{}".format(candle),
                        "Pivot.M.Camarilla.R2|{}".format(candle),
                        "Pivot.M.Camarilla.R3|{}".format(candle),
                        "Pivot.M.Woodie.S3|{}".format(candle),
                        "Pivot.M.Woodie.S2|{}".format(candle),
                        "Pivot.M.Woodie.S1|{}".format(candle),
                        "Pivot.M.Woodie.Middle|{}".format(candle),
                        "Pivot.M.Woodie.R1|{}".format(candle),
                        "Pivot.M.Woodie.R2|{}".format(candle),
                        "Pivot.M.Woodie.R3|{}".format(candle),
                        "Pivot.M.Demark.S1|{}".format(candle),
                        "Pivot.M.Demark.Middle|{}".format(candle),
                        "Pivot.M.Demark.R1|{}".format(candle)
                    ]
        }

        return(payload)


def mlog(exchange, market, *text):
        text = [str(i) for i in text]
        text = " ".join(text)
        
        datestamp = str(datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3])

        print("[{} {}:{}] - {}".format(datestamp, exchange, market, text))


def get_resp(exchange, market, candle):
        mlog(exchange, market, "Getting respone for {}:{}, {} minute candle.".format(exchange, market, candle))
        headers = {'User-Agent': 'Mozilla/5.0'}
        url = "https://scanner.tradingview.com/crypto/scan"

        payload = make_payload(exchange, market)
        resp = requests.post(url,headers=headers,data=json.dumps(payload)).json()
        
        return resp 

def get_signal(exchange, market, candle, signal_id, log=False):
        if log:
            mlog(exchange, market, "Getting TV signal for {}:{}, {} minute candle.".format(exchange, market, candle))
        signal = get_resp(exchange, market, candle)
        signal = oscillator = resp["data"][0]["d"][signal_id]

        return(signal)

if __name__ == "__main__":
        if len(sys.argv) >= 4:
            exchange = sys.argv[1]
            market = sys.argv[2]
            candle = sys.argv[3]
        else:
            exchange = "BINANCE"
            market = "ETHBTC"
            candle = 5 #Represented in minutes

        resp = get_resp(exchange, market, candle)

        if len(sys.argv) == 5 and sys.argv[4] == "p":
            payload = make_payload(exchange, market)
            for i, k in enumerate(payload["columns"]):
                print(str(k), " = ", str(resp["data"][0]["d"][i]))
