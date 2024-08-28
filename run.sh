#!/usr/bin/bash

# cp -r ~/code/oaie/oaie-cgc1w/csv/unit* .

n=4 # Number of units

for ((i=1; i<=n; i++)); do
	if [ $i -ne 1 ]; then
		sleep 5s
	fi
	npm run createImages "unit$i/assets/unit$i" "unit$i"/*.csv
done

for ((i=1; i<=n; i++)); do
	if [ $i -ne 1 ]; then
		sleep 2s
	fi
	npm run combine "unit$i/combine.csv" "unit$i"/*.csv
done

read -p "Please import combine.csv files to D2L and add export urls to urls file."

for ((i=1; i<=n; i++)); do
	IFS=""
	read -r url
	wget "$url" -O "unit$i/pack.zip"
done < urls

for ((i=1; i<=n; i++)); do
	if [ $i -ne 1 ]; then
		sleep 2s
	fi
	npm run repack "unit$i/assets/unit$i" "unit$i/pack.zip"
done
