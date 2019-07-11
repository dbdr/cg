
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
}

CGController.init()
console.log( CGUi, CGLadder, CGController)
