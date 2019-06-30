
var CGLadder = new function() {

	let cachedRankings = new Map();

	this.getCachedRankings = () => { return cachedRankings }

	/**
	* Stores the rankings in local storage
	**/
	this.storeRankings = function() {
		let mapAsObj = {}
		for( let item of cachedRankings ) {
			mapAsObj[item[0]] = item[1]
			console.log( item[0], item[1] )
		}
		console.log( mapAsObj )
		localStorage.setItem("cg-rankings", JSON.stringify({ timestamp: Date.now(), map: mapAsObj }))
	}

	/**
	* Get the rankings stored
	*/
	this.getStoredRankings = function() {
		let store = localStorage.getItem("cg-rankings")
		if( store ) {
			store = JSON.parse( store )
			let timestamp = store.timestamp
			let mapAsObj = store.map
			let cache = new Map()

			for( let item in mapAsObj )
				cache.set( item, mapAsObj[item] )

			return { timestamp: timestamp, map : cache }
		}
		return null
	}

	/**
	* Restore the rankings to the RAM cache
	*/
	this.restoreRankings = function() {
		let cache = this.getStoredRankings()
		if( !cache ) {
			console.warn( "Nothing to restore" );
			return;
		}
		if( ( Date.now() - cache.timestamp ) < 1000 * 60 * 60 ) { // 1 hour
			cachedRankings = cache.map
		}
	}

	this.fetchRankings = function() {

		const active = specializedRanking && yType !== 'all';
		let column = '', filter = '';
		if (active) {
			column = "CODINGPOINTS";
			switch (yType) {
				case "contest":
					filter = "CONTESTS";
					break;
				case "multi":
					filter = "MULTITRAINING";
					break;
				case "golf":
					filter = "CODEGOLF";
					break;
				case "optim":
					filter = "OPTIM";
					break;
				case "clash":
					filter = "CLASH";
					break;
			}
		}
		let options = `[${rankingPage},{'keyword':'','active':${active},'column':'${column}','filter':'${filter}'},null,true,'global']`;
		console.log(options);


		this.restoreRankings()

		const leaderboard = cachedRankings.get(options);
		if (leaderboard) {
			this.addJoinDates(0, leaderboard);
			return;
		}

		startSpin();

		Http.post( "https://www.codingame.com/services/Leaderboards/getGlobalLeaderboard", options )
			.subscribe( ( res ) => {
				console.log( res )
				cachedRankings.set( options, res )
				this.storeRankings( )
				this.addJoinDates( 0, res )
			})

	}

	this.addJoinDates = function( player, leaderboard ) {

		if (player === leaderboard.users.length) {

			// console.log(JSON.stringify(joinDates));
			updateRanking(leaderboard);

		} else {

			const user = leaderboard.users[player].codingamer;
			let joinDate = joinDates[user.userId];

			if (joinDate) {

				user.joinDate = joinDate;
				this.addJoinDates(player + 1, leaderboard);

			} else {

				this.fetchJoinDate(player, user, leaderboard);

			}
		}

	}

	this.fetchJoinDate = function(player, user, leaderboard) {

		Http.post(
				"https://www.codingame.com/services/CodinGamer/findCodingamePointsStatsByHandle",
				`['${user.publicHandle}']`
			).subscribe(
				( res ) => {
					const joinDate = res.codingamePointsRankingDto.rankHistorics.dates[0];
					joinDates[user.userId] = joinDate;
					user.joinDate = joinDate;
					this.addJoinDates(player + 1, leaderboard);
				}
			)

	}


};

settingsChanged();
