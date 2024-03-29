
/**
* Controller module, only module allowed to be called by the view
* Expose through this calls to the other modules
*/
let CGController = new function() {

  this.init = function() {

    CGDatabase.init( )
	
    CGUi.init( )
    CGUi.startSpin()
	
	CGLadder.specializedRanking = CGUi.getSpecializedRanking()
	CGLadder.abscissaType = CGUi.getAbscissaType()
	CGLadder.ordinateType = CGUi.getOrdinateType()

    CGLadder.init(ranking => {
		CGUi.updateRanking( ranking )
		console.log( ranking)
	});
  }

	reload = () => {
		CGUi.startSpin()
		CGLadder.fetchRankings(ranking => {
			CGUi.updateRanking( ranking )
			console.log( ranking)
		})
	}

  this.changeOrdinate = function( elem ) {
    CGLadder.ordinateType = elem.value
    CGUi.changeOrdinate( elem )
	reload()
  }

  this.toggleSpecialization = function( elem ) {
    CGLadder.specializedRanking = elem.checked
	reload()
  }

  this.changeAbscissa = function( elem ) {
    CGLadder.abscissaType = elem.value
    CGUi.changeAbscissa( elem )
    CGUi.startSpin()
    CGUi.refreshGraph()
    CGUi.stopSpin()
  }

  this.changePage = function( elem ) {
    CGLadder.rankingPage = elem.value
	reload()
  }

	this.getGolfScores = async function (pseudo) {
		const now = Math.floor(new Date().getTime() / 1000)

		const cacheDoc = CGDatabase.collection('golf').doc(pseudo)
		const doc = await cacheDoc.get()
		if (doc.exists) {
			const data = doc.data();
			const age = now - data.cacheTime;
			if (age < 1 * 3600)
				return data.scores
		}
		
		const allData = await Promise.all(GOLF_GAMES.map(game => Http.get('http://cgstats.proxy.magusgeek.com/search', `game=${game.id}&player=${pseudo}`).promise()));
		const golfScores = allData.map((gameData, idx) => {
			const game = GOLF_GAMES[idx];
			console.log('Golf data:', game, gameData)
			const points = gameData.stats.slice(0, 5).map(s=>s.points).reduce((a,b)=>a+b, 0)
			return { game: game.name, points: points }
		})
		CGDatabase.collection('golf').doc(pseudo).set({ cacheTime: now, scores: golfScores })
		return golfScores
	}
}

CGController.init()
console.log( CGUi, CGLadder, CGController)
