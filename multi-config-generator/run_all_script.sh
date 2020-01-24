#!/bin/sh

min_diff=15

get_time_minutes_ago() {
   mdiff=$1 
   hour=`date '+%H'`
   minute=`date '+%M'`
   second=`date '+%S'`

   mcond=$(( $minute - $mdiff ))
   if [ $mcond -lt 0 ]
   then
     hour=$(( $hour - 1 + 24))
     hour=$(( $hour % 24 ))
   fi

   minute=$(( $minute - $mdiff + 60 ))
   minute=$(( $minute % 60 ))

   hour=$(printf "%02d" $hour)   
   minute=$(printf "%02d" $minute)   
   second=$(printf "%02d" $second)

   from=`date '+%Y-%m-%d'`
   from=$from" $hour:$minute:$second"
   echo $from
}

while true
do
    PID=$( pgrep -f "npm-run-all" )
    #echo $PID

    if [ ! -z "$PID" ]
    then
       echo "process is running"
       sleep 1m
       true
    else 
       echo "process is not running, restarting the process."
       echo "remove past scripts"
       echo "npm run remove-configs"
       npm run remove-configs

       now=`date '+%Y-%m-%d %T'`
       to=$now
       from=$( get_time_minutes_ago $min_diff )

       echo "create config files"
       echo "npm run import -e binance -c BTC -f $from -t $to"
       echo "$PWD"
       echo $from
       echo $to
       npm run import -e binance -c BTC -f $from -t $to

       echo "start importing"
       echo "npm run run-all > run_log.txt"
       npm run run-all > run_log.txt
       echo "finished importing"
       echo "--------------------------------"
    fi
    sleep 1m
done
