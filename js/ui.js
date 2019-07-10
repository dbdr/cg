
/**
* The module handles complex UI
* IT shouldn't manipulate data unless it's for the sole purpose of showing it
*/
let CGUi = new function() {

  let WIDTH = 2000;
  let HEIGHT = 800;

  let IMAGE_SIZE = 30;

  let margins = {
      top: 40,
      bottom: 40,
      left: 100,
      right: 100
    };

  const DEFAULT_OPTIONS = {
    lines: 12, // The number of lines to draw
    length: 0, // The length of each line
    width: 18, // The line thickness
    radius: 43, // The radius of the inner circle
    scale: 1.0, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#000000', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    speed: 0.5, // Rounds per second
    rotate: 0, // The rotation offset
    animation: 'spinner-line-fade-default', // The CSS animation name for the lines
    direction: 1, // 1: clockwise, -1: counterclockwise
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: '0 0 1px transparent', // Box-shadow for the lines
    position: 'absolute' // Element positioning
  };

  let spinner = new Spinner( DEFAULT_OPTIONS );



  /**
  * Initialize the UI
  */
  this.init = function() {

    this.savedRanking = null;

	this.changeAbscissa(document.querySelector('input[name = "x-value"]:checked') || 'rank')
	this.changeOrdinate(document.querySelector('input[name = "y-value"]:checked') || 'all')
	
    this.svg = d3
      .select("#graph")
        .append("svg")
        	.attr("preserveAspectRatio", "xMinYMin meet")
        	.attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT)
        	.classed("svg-content", true)
        	.append("g")
            .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    this.tooltip = d3
      .select("body")
        .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

    console.log( "CGUi Initialized" )

  }

  // === Dims

  this.innerDimensions = function() {
    return {
      top: margins.top,
      left: margins.left,
      width: WIDTH - (margins.left + margins.right),
      height: HEIGHT - (margins.top + margins.bottom)
    }
  }

  // === Spinner

  /**
  * Start the spinner
  */
  this.startSpin = function() {
    spinner.spin( d3.select("#graph")[0][0] )
  }

  /**
  * Stop the spinner
  */
  this.stopSpin = function() {
    spinner.stop()
  }

  /**
  * Start or stop the Spinner
  * @param state true to start, false to stop the spinner
  */
  this.spin = function( state ) {
    if( state ) this.startSpin()
    else        this.stopSpin()
  }

  // === Graph

  // Initialize values from the DOM (might not be the default, e.g. after Reload on Firefox)
  this.getSpecializedRanking = () => document.querySelector('#specialized').checked

  let abscissaType
  let ordinateType

  this.getAbscissaType = () => abscissaType;
  this.getOrdinateType = () => ordinateType;

  let getOrdinateValueFunction = ( value ) => {
    switch( value ) {
      case "all":     return d => d.score;
      case "contest": return d => d.contests;
      case "multi":   return d => d.multiTraining;
      case "golf":    return d => d.codegolf;
      case "optim":   return d => d.optim;
      case "clash":   return d => d.clash;
      default:        return d => d.score;
    }
  }

  this.changeAbscissa = function( newType ) {
    abscissaType = ( typeof newType === "string" ? newType : newType.value )
  }

  this.changeOrdinate = function( newType ) {
    ordinateType = ( typeof newType === "string" ? newType : newType.value )
    document.querySelector('#specialized-section').style.visibility = ordinateType === 'all' ? 'hidden' : 'visible';
  }

  this.getOrdinateType = function() { return ordinateType }

  this.refreshGraph = function() {

    if( !this.savedRanking ) return

    const data = this.savedRanking.users;


    let dims = this.innerDimensions()

    // Setup abscissa informations

    let abscissaMeta = {
      label: "",
      valueFunction: null,
      showFunction: null,
      mapFunction: null,
      scale: null,
      axis: null
    }

    switch( abscissaType ) {
      case "join":
        abscissaMeta.label          = "Join Date"
        abscissaMeta.valueFunction  = d => new Date( +d.codingamer.joinDate )
        abscissaMeta.showFunction   = d => abscissaMeta.valueFunction( d ).toISOString().split('T')[0];
        abscissaMeta.scale          = d3.time.scale().range( [ 0, dims.width ] )
        abscissaMeta.axis           = d3.svg.axis().scale( abscissaMeta.scale ).orient("bottom")
        abscissaMeta.mapFunction    = d => abscissaMeta.scale( abscissaMeta.valueFunction( d ) )
        abscissaMeta.scale.domain( [
            d3.min( data, abscissaMeta.valueFunction ),
            d3.max( data, abscissaMeta.valueFunction )
          ])
        break;
      case "level":
        abscissaMeta.label          = "XP Level"
        abscissaMeta.valueFunction  = d => d.codingamer.level
        abscissaMeta.showFunction   = d => "lvl " + d.codingamer.level;
        abscissaMeta.scale          = d3.scale.linear().range( [ 0, dims.width ] )
        abscissaMeta.axis           = d3.svg.axis().scale( abscissaMeta.scale ).orient("bottom")
        abscissaMeta.mapFunction    = d => abscissaMeta.scale( abscissaMeta.valueFunction( d ) )
        abscissaMeta.scale.domain( [
            d3.min( data, abscissaMeta.valueFunction ) - 1,
            d3.max( data, abscissaMeta.valueFunction ) + 1
          ])
        break;
      default:
        abscissaType = "rank"
      case "rank":
        abscissaMeta.label          = "Rank"
        abscissaMeta.valueFunction  = d => d.rank
        abscissaMeta.showFunction   = d => "#" + abscissaMeta.valueFunction( d )
        abscissaMeta.scale          = d3.scale.linear().range( [ dims.width, 0 ] )
        abscissaMeta.axis           = d3.svg.axis().scale( abscissaMeta.scale ).orient("bottom")
        abscissaMeta.mapFunction    = d => abscissaMeta.scale( abscissaMeta.valueFunction( d ) )
        abscissaMeta.scale.domain( [
            d3.min( data, abscissaMeta.valueFunction ) - 1,
            d3.max( data, abscissaMeta.valueFunction ) + 1
          ])
        break;
    }

    console.log( abscissaType, ordinateType, abscissaMeta )

    // Setup ordinate informations

    let ordinateValueFunction  = getOrdinateValueFunction( ordinateType )
    let
        ordinateScale         = d3.scale.linear().range( [ dims.height, 0 ] ),
        ordinateMapFunction   = d => ordinateScale( ordinateValueFunction(d) ),
        ordinateAxis          = d3.svg.axis().scale( ordinateScale ).orient( "left" )

    const
        min = d3.min( data, ordinateValueFunction ),
        max = d3.max( data, ordinateValueFunction ),
        range = max - min
    ordinateScale.domain( [min - range * 0.025, max + range * 0.025] )

    // Clean the graph

    while( this.svg[0][0].children.length > 0 ) {
      this.svg[0][0].removeChild( this.svg[0][0].children[0] )
    }

    this.svg
      .append("g")
    		.attr("class", "x axis")
    		.attr("transform", "translate(0," + dims.height + ")")
    		.call( abscissaMeta.axis )
    		.append("text")
      		.attr("class", "label")
      		.attr("x", dims.width )
      		.attr("y", -6)
      		.style("text-anchor", "end")
      		.text( abscissaMeta.label );

  	// y-axis
  	this.svg
      .append("g")
    		.attr("class", "y axis")
    		.call( ordinateAxis )
    		.append("text")
      		.attr("class", "label")
      		.attr("transform", "rotate(-90)")
      		.attr("y", 6)
      		.attr("dy", ".71em")
      		.style("text-anchor", "end")
      		.text("CodingPoints");

  	// draw dots
  	this.svg.selectAll(".dot")
  		.data(data)
  		.enter()
  		.append("svg:a")
        .attr(
          "xlink:href",
           d => "https://www.codingame.com/profile/" + d.codingamer.publicHandle
        )
        .attr("target", "_blank")
    		.append("svg:image")
      		.attr("x", x => abscissaMeta.mapFunction( x ) - IMAGE_SIZE / 2 )
      		.attr("y", y => ordinateMapFunction( y ) - IMAGE_SIZE / 2 )
      		.attr('width', IMAGE_SIZE )
      		.attr('height', IMAGE_SIZE )
      		.attr(
            "xlink:href",
            d => d.codingamer.avatar
					? "https://static.codingame.com/servlet/fileservlet?id=" + d.codingamer.avatar + "&format=navigation_avatar"
					: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973461_960_720.png"
          )
      		.on(
            "mouseover",
            (d) => {

              this.tooltip.transition()
        				.duration(200)
        				.style("opacity", .9);

              this.tooltip.html(
                  d.pseudo + "<br/> ("
                  + abscissaMeta.showFunction(d)
        				  + ", "
                  + ordinateValueFunction( d )
                  + ")"
                )
        				.style("left", (d3.event.pageX + 5) + "px")
        				.style("top", (d3.event.pageY - 28) + "px");
        		}
          )
      		.on("mouseout", (d) => {
      			this.tooltip.transition()
      				.duration(500)
      				.style("opacity", 0);
      		});

  }

  this.updateRanking = function( ranking ) {
    this.savedRanking = ranking
    this.stopSpin()
    this.refreshGraph()
  }

};
