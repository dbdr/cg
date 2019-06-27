const W = 2000;
const H =  800;

const zone = d3.select("#graph")[0][0];
const margin = {top: 40, right: 100, bottom: 40, left: 100},
    width = W - margin.left - margin.right,
    height = H - margin.top - margin.bottom;

// add the graph canvas to the body of the webpage
const svg = d3.select("#graph").append("svg")
	.attr("preserveAspectRatio", "xMinYMin meet")
	.attr("viewBox", "0 0 " + W + " " + H)
	.classed("svg-content", true)
	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let savedRanking = null;
let xType = "rank";

function xAxisChange(radio) {
	xType = radio.value;
	displayRanking();
}

function updateRanking(ranking) {
	savedRanking = ranking;
	displayRanking();
}

function displayRanking() {
	if (! savedRanking)
		return;

	const data = savedRanking.users;

	/* 
	 * value accessor - returns the value to encode for a given data object.
	 * scale - maps value to a visual display encoding, such as a pixel position.
	 * map function - maps from data value to display value
	 * axis - sets up axis
	 */ 

	// setup x 
	var xValue, xScale, xMap, xAxis, xLabel;
	
	switch (xType) {
		case "join":
		case "level":
			xLabel = "XP Level";
			xValue = function(d) { return d.codingamer.level;}; // data -> value
			xScale = d3.scale.linear().range([0, width]); // value -> display
			xMap = function(d) { return xScale(xValue(d));}; // data -> display
			xAxis = d3.svg.axis().scale(xScale).orient("bottom");

			// setup fill color
			cValue = function(d) { return d.codingamer.level;};
			color = d3.scale.linear().domain([10,55]).range(["yellow", "red"]);

			// don't want dots overlapping axis, so add in buffer to data domain
			xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
			break;
		
		case "rank":
			xLabel = "Rank";
			xValue = function(d) { return d.rank;}; // data -> value
			xScale = d3.scale.linear().range([width, 0]); // value -> display
			xMap = function(d) { return xScale(xValue(d));}; // data -> display
			xAxis = d3.svg.axis().scale(xScale).orient("bottom");

			// setup fill color
			cValue = function(d) { return d.codingamer.level;};
			color = d3.scale.linear().domain([10,55]).range(["yellow", "red"]);

			// don't want dots overlapping axis, so add in buffer to data domain
			xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
			break;
	}

	// setup y
	let yValue = function(d) { return d.score;}, // data -> value
		yScale = d3.scale.linear().range([height, 0]), // value -> display
		yMap = function(d) { return yScale(yValue(d));}, // data -> display
		yAxis = d3.svg.axis().scale(yScale).orient("left");
	yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

	while (svg[0][0].children.length > 0) {
		svg[0][0].removeChild(svg[0][0].children[0]);
	}

	// x-axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.append("text")
		.attr("class", "label")
		.attr("x", width)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text(xLabel);

	// y-axis
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
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
		.enter().append("circle")
		.attr("class", "dot")
		.attr("r", 3.5)
		.attr("cx", xMap)
		.attr("cy", yMap)
		.style("fill", function(d) { return color(cValue(d));}) 
		.on("mouseover", function(d) {
			tooltip.transition()
				.duration(200)
				.style("opacity", .9);
			tooltip.html(d["pseudo"] + "<br/> (#" + xValue(d) 
				+ ", " + yValue(d) + ")")
				.style("left", (d3.event.pageX + 5) + "px")
				.style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);
		});
}
