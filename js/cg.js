
/**
* This module is solely there to manipulate and hold the data locally.
* This shouldn't call directly the UI module, leave it to the Controller.
* It may call the database module
*/
var CGLadder = new function() {

	let cachedRankings = new Map();
	let joinDates = {}

	/**
	* Toggle on and off the specialization of ranking for one type of ladder
	*/
	// this.specializedRanking set by CGController
	// this.abscissaType set by CGController
	// this.ordinateType set by CGController
	this.rankingPage					= 1

	this.getCachedRankings = () => { return cachedRankings }


	this.init = function(callback) {
		this.getJoinDates(() => CGLadder.fetchRankings(callback));
	}

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

	this.fetchRankings = function( callback ) {

		const active = this.specializedRanking && this.ordinateType !== 'all';
		let column = '', filter = '';
		if (active) {
			column = "CODINGPOINTS";
			switch (this.ordinateType) {
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
		let options = `[${this.rankingPage},{'keyword':'','active':${active},'column':'${column}','filter':'${filter}'},null,true,'global']`;
		console.log(options);


		this.restoreRankings()

		const leaderboard = cachedRankings.get(options);
		if (leaderboard) {
			this.addJoinDates( 0, leaderboard, callback );
			return;
		}

		Http.post( "https://www.codingame.com/services/Leaderboards/getGlobalLeaderboard", options )
			.subscribe( ( res ) => {
				console.log( res )
				cachedRankings.set( options, res )
				this.storeRankings( )
				this.addJoinDates( 0, res, callback )
			})

	}

	this.addJoinDates = function( player, leaderboard, callback ) {

		if (player === leaderboard.users.length) {

			if (joinDates.changed) {
				CGDatabase.collection('users').doc('join-dates').set(joinDates)
				joinDates.changed = false
			}

			if( callback ) 	callback( leaderboard )

		} else {

			const user = leaderboard.users[player].codingamer;
			let joinDate = joinDates[user.userId];

			if (joinDate) {

				user.joinDate = joinDate;
				this.addJoinDates( player + 1, leaderboard, callback );

			} else {

				this.fetchJoinDate( player, user, leaderboard, callback );

			}
		}

	}

	this.getJoinDates = function(callback) {
		CGDatabase.getJoinDates( _joinDates => {
			joinDates = _joinDates
			joinDates.changed = false
			console.log( "Join dates fetched" )
			if (callback)
				callback()
		})
	}

	this.fetchJoinDate = function( player, user, leaderboard, callback ) {

		Http.post(
				"https://www.codingame.com/services/CodinGamer/findCodingamePointsStatsByHandle",
				`['${user.publicHandle}']`
			).subscribe(
				( res ) => {

					const joinDate = res.codingamePointsRankingDto.rankHistorics.dates[0];
					console.log("New user: ", user.pseudo, res);
					let data = {
						"join-date": joinDate,
					};
					if (user.pseudo) {
						data.pseudo = user.pseudo;
					}

					joinDates[user.userId] = joinDate;
					joinDates.changed = true

					user.joinDate = joinDate;
					this.addJoinDates(player + 1, leaderboard, callback );

				})

	}

};
