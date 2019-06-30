const W = 2000;
const H =  800;

const IMG_SIZE = 30;

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

const opts = {
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
const spinner = new Spinner(opts);

function startSpin() {
	spinner.spin(d3.select("#graph")[0][0]);
}

let savedRanking = null;
let xType = "rank";

function xAxisChange(radio) {
	xType = radio.value;
	displayRanking();
}

xAxisChange(document.querySelector('input[name = "x-value"]:checked'));

let yType;
let specializedRanking = false;
function settingsChanged() {
	yType = document.querySelector('input[name = "y-value"]:checked').value;
	specializedRanking = document.querySelector('#specialized').checked;
	document.querySelector('#specialized-section').style.visibility = yType === 'all' ? 'hidden' : 'visible';
	CGLadder.fetchRankings();
}

let rankingPageElement = document.querySelector('select#rankingPage');
let rankingPage = rankingPageElement.selectedOptions[0].value;
console.log('rankingPage', rankingPage);

rankingPageElement.addEventListener('change', (event) => {
	rankingPage = event.target.value;
	CGLadder.fetchRankings();
});

function updateRanking(ranking) {
	savedRanking = ranking;
	spinner.stop();
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
	var xValue, xShowValue, xScale, xMap, xAxis, xLabel;

	switch (xType) {
		case "join":
			xLabel = "Join Date";
			xValue = d => new Date(+d.codingamer.joinDate); // data -> value
			xShowValue = d => xValue(d).toISOString().split('T')[0]; // data -> label
			xScale = d3.time.scale().range([0, width]); // value -> display
			xMap = function(d) { return xScale(xValue(d));}; // data -> display
			xAxis = d3.svg.axis().scale(xScale).orient("bottom");

			xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
			break;

		case "level":
			xLabel = "XP Level";
			xValue = function(d) { return d.codingamer.level;}; // data -> value
			xShowValue = function(d) { return "lvl " + d.codingamer.level;}; // data -> label
			xScale = d3.scale.linear().range([0, width]); // value -> display
			xMap = function(d) { return xScale(xValue(d));}; // data -> display
			xAxis = d3.svg.axis().scale(xScale).orient("bottom");

			// don't want dots overlapping axis, so add in buffer to data domain
			xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
			break;

		case "rank":
			xLabel = "Rank";
			xValue = function(d) { return d.rank;}; // data -> value
			xShowValue = function(d) { return "#" + d.rank;}; // data -> label
			xScale = d3.scale.linear().range([width, 0]); // value -> display
			xMap = function(d) { return xScale(xValue(d));}; // data -> display
			xAxis = d3.svg.axis().scale(xScale).orient("bottom");

			// don't want dots overlapping axis, so add in buffer to data domain
			xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
			break;
	}

	// setup y
	let yValue;
	switch (yType) {
		case "all":
			yValue = d => d.score;
			break;

		case "contest":
			yValue = d => d.contests;
			break;

		case "multi":
			yValue = d => d.multiTraining;
			break;

		case "golf":
			yValue = d => d.codegolf;
			break;

		case "optim":
			yValue = d => d.optim;
			break;

		case "clash":
			yValue = d => d.clash;
			break;
	}
	let yScale = d3.scale.linear().range([height, 0]), // value -> display
		yMap = d => yScale(yValue(d)), // data -> display
		yAxis = d3.svg.axis().scale(yScale).orient("left");
	const min = d3.min(data, yValue);
	const max = d3.max(data, yValue);
	yScale.domain([min - (max - min) * 0.025, max + (max - min) * 0.025]);

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
		.enter()
		.append("svg:a").attr("xlink:href", d => "https://www.codingame.com/profile/" + d.codingamer.publicHandle).attr("target", "_blank")
		.append("svg:image")
		.attr("x", x => xMap(x) - IMG_SIZE / 2)
		.attr("y", y => yMap(y) - IMG_SIZE / 2)
		.attr('width', IMG_SIZE)
		.attr('height', IMG_SIZE)
		.attr("xlink:href", d => "https://static.codingame.com/servlet/fileservlet?id=" + d.codingamer.avatar + "&format=navigation_avatar")
		.on("mouseover", function(d) {
			tooltip.transition()
				.duration(200)
				.style("opacity", .9);
			tooltip.html(d["pseudo"] + "<br/> (" + xShowValue(d)
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
