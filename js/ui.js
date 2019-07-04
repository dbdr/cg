
let CGUi = new function() {

  let WIDTH = 2000;
  let HEIGHT = 800;

  let IMAGE_SIZE = 30;

  let margins = {
      top: 40,
      bottom: 40,
      left: 100,
      right: 100
    }

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

    this.refreshGraph()
    
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

  let savedRanking = null;
  let abscissaType = "rank"
  let specializedRanking = false
  let ordinateType = null

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
    abscissaType = ( typeof value === "string" ? newType : newType.value )
    this.refreshGraph()
  }

  this.changeOrdinate = function( newType ) {
    ordinateType = ( typeof value === "string" ? newType : newType.value )
    this.refreshGraph()
  }

  this.refreshGraph = function() {

    if( !savedRanking ) return

    const data = savedRanking.users;

    // Setup abscissa informations

    let abscissaMeta = {
      label: "",
      valueFunction: null,
      showFunction: null,
      mapFunction: null,
      scale: null,
      axis: null
    }

    switch( ordinateType ) {
      case "join":
        abscissaMeta.label          = "Join Date"
        abscissaMeta.valueFunction  = d => new Date( +d.codingamer.joinDate )
        abscissaMeta.showFunction   = d => abscissaMeta.valueFunction( d ).toDateString()
        abscissaMeta.scale          = d3.time.scale().range( [ 0, width ] )
        break;
      case "level":
        abscissaMeta.label          = "XP Level"
        abscissaMeta.valueFunction  = d => new Date( +d.codingamer.joinDate )
        abscissaMeta.showFunction   = d => abscissaMeta.valueFunction( d ).toDateString()
        abscissaMeta.scale          = d3.scale.linear().range( [ 0, width ] )
        break;
      case "level":
        abscissaMeta.label          = "Rank"
        abscissaMeta.valueFunction  = d => d.rank
        abscissaMeta.showFunction   = d => "#" + abscissaMeta.valueFunction( d )
        abscissaMeta.scale          = d3.scale.linear().range( [ 0, width ] )
        break;
    }

    abscissaMeta.axis           = d3.svg.axis().scale( abscissaMeta.scale ).orient("bottom")
    abscissaMeta.mapFunction    = d => abscissaMeta.scale( abscissaMeta.valueFunction( d ) )
    abscissaMeta.scale.domain( [
        d3.min( data, abscissaMeta.valueFunction ) - 1,
        d3.max( data, abscissaMeta.valueFUnction ) + 1
      ])

    // Setup ordinate informations

    let ordinateValueFunction  = getOrdinateValueFunction( ordinateType )
    let
        ordinateScale         = d3.scale.linear().range( [ HEIGHT, 0 ] ),
        ordinateMapFunction   = d => ordinateScale( ordinateValueFunction(d) ),
        ordinateAxis          = d3.svg.axis().scale( ordinateScale ).orient( "left" )

    const
        min = d3.min( data, ordinateValueFunction ),
        max = d3.max( data, ordinateValueFunction ),
        range = max - min
    ordinateScale.domain( [min - range * 0.025, max + range * 0.025] )

    // Clean the graph

    while( svg[0][0].children.length > 0 ) {
      svg[0][0].removeChild( svg[0][0].children[0] )
    }

    svg
      .append("g")
    		.attr("class", "x axis")
    		.attr("transform", "translate(0," + HEIGHT + ")")
    		.call( abscissaMeta.axis )
    		.append("text")
      		.attr("class", "label")
      		.attr("x", WIDTH )
      		.attr("y", -6)
      		.style("text-anchor", "end")
      		.text( abscissaMeta.label );

  	// y-axis
  	svg
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
  	svg.selectAll(".dot")
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
            d => "https://static.codingame.com/servlet/fileservlet?id="
              + d.codingamer.avatar + "&format=navigation_avatar"
          )
      		.on(
            "mouseover",
            (d) => {

              this.tooltip.transition()
        				.duration(200)
        				.style("opacity", .9);

              this.tooltip.html(
                  ["pseudo"] + "<br/> ("
                  + abscissaMeta.valueFunction(d)
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

};
