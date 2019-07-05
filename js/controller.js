

let CGController = new function() {

  CGUi.changeAbscissa( CGLadder.abscissaType )
  CGUi.changeOrdinate( CGLadder.ordinateType )
  CGUi.init()

  this.changeOrdinate = function( elem ) {
    CGLadder.ordinateType = elem.value
    CGUi.changeOrdinate( elem )
    CGUi.startSpin()
    CGLadder.fetchRankings(
            ranking => {
              CGUi.updateRanking( ranking )
              console.log( ranking)
            })
  }

  this.toggleSpecialization = function( elem ) {
    CGLadder.specializedRanking = elem.value
    CGUi.refreshGraph()
  }

  this.changeAbscissa = function( elem ) {
    CGLadder.abscissaType = elem.value
    CGUi.changeAbscissa( elem )
    CGUi.startSpin()
    CGUi.refreshGraph()
  }

  this.changePage = function( elem ) {
    CGLadder.rankingPage = elem.value
    CGLadder.fetchRankings()
    CGUi.refreshGraph()
  }
}

console.log( CGUi, CGLadder, CGController)
