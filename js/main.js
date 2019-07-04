

let CGController = new function() {

  CGUi.init()

  this.changeOrdinate = function( elem ) {
    CGUi.changeOrdinate( elem.value )
    CGUi.refreshGraph()
  }

  this.toggleSpecialization = function( elem ) {
    CGLadder.specializedRanking = elem.value
    CGUi.refreshGraph()
  }

}

console.log( CGUi)
