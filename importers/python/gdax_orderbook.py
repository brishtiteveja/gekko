import asyncio
import os
import sys
import datetime
import time

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(root + '/python')

import ccxt.async_support as ccxt  # noqa: E402

exchange = None

async def poll():
    global exchange
    exchange = ccxt.coinbasepro()
    while True:
        try:
            yield await exchange.fetch_order_book('BTC/USD')
            await asyncio.sleep(exchange.rateLimit / 1000)
        except Exception as e:
            print("Exception Occurred")
            time.sleep(5)
    exchange.close()


async def main():
    async for orderbook in poll():
        nbids = len(orderbook['bids'])
        nasks = len(orderbook['asks'])
        i = 0
        now = exchange.seconds()
        time = datetime.datetime.utcfromtimestamp(now).strftime("%Y-%m-%d %H:%M-%S")
        print("Time = ", time)

        print("Bids = ", nbids, ", Asks = ", nasks)
        while True:
            if i < nbids and i < nasks: 
                b = orderbook['bids'][i]
                a = orderbook['asks'][i]

                s = "{0:3}: Bid: [{1:15}, {2:15}], Ask: [{3:15}, {4:15}]".format(i, b[0], b[1], a[0], a[1])
                print(s)
               
                i += 1
            else:
                j = i
                while j < nbids: 
                    print(orderbook['bids'][i], "Empty asks")
                    j += 1
                while j < nasks: 
                    print("Empty bids", orderbook['asks'][i])
                    j += 1

                break
        print("\n \n")
        print("--------------------------------------------")

asyncio.get_event_loop().run_until_complete(main())
