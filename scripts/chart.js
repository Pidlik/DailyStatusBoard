
/* Chart Code used:
 *
 * https://www.chartjs.org/
 * https://www.chartjs.org/samples/latest/charts/bar/stacked.html
 */

// TODO: Remove, initially used when debugging without user input
function random(){
	return Math.ceil(Math.random() * 10 + 1);
}

const DEBUG = true;
function DEBUG_LOG(string) {
	if(DEBUG == true) {
		console.log('[DEBUG] ' + string);
	}
}

// Constants
const MAX_DATA_LENGTH = 10; // At most 10 days showing in the chart
const MAX_DATA_INPUT = 15;	// At most 15 +/- in input
const PLUS_DATASET = 0;			// Dataset index
const MINUS_DATASET = 1;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PLUS_INDEX = 0;
const MINUS_INDEX = 1;
// TODO: Remove once figured out how to retrieve min/max ticks in chart options
const Y_AXES_TICKS_SUGGESTED_MIN = -5;
const Y_AXES_TICKS_SUGGESTED_MAX = 5;

var secretCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
var secretCodeIndex = 0;

// Dates for each data entry
var DATA_DATES = [];
// Comment for each data entry
var DAILY_COMMENTS = [];

// TODO: Needed? Just input the rgb string directly in the chartData?
window.chartColors = {
	red: 'rgb(220, 20, 60)',
	redOp: 'rgb(220, 20, 60, 0.6)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(34, 175, 34)',
	greenOp: 'rgb(34, 175, 34, 0.6)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(231,233,237)'
};

/**
 * Data for the displayed bar chart, this variable is used when updating
 * the chart. Initially start with no labels and no data that later gets added
 * from user input. 
 */
var chartData = {
	labels: [],
	datasets: [{
		label: 'Plus',
		backgroundColor: window.chartColors.greenOp,//color(window.chartColors.green).alpha(0.5).rgbString(),
		borderColor: window.chartColors.green,
		borderWidth: 1,
		data: []
	}, {
		label: 'Minus',
		backgroundColor: window.chartColors.redOp,
		borderColor: window.chartColors.red,
		borderWidth: 1,
		data: []
	}]
}; // chartData

class ChartHandler {
	constructor() {
		console.log('[INFO] ##### Entering ChartHandler::constructor #####');

		let labels = Cookies.getJSON('Labels');
		let plusData = Cookies.getJSON('PlusData');
		let minusData = Cookies.getJSON('MinusData');

		if(plusData != undefined && minusData != undefined) {
			// We retrieve DATA_DATES and DAILY_COMMENTS here since getting it if nothing else is defined overwrites it with 'undefined'
			DATA_DATES = Cookies.getJSON('Data Dates');
			DAILY_COMMENTS = Cookies.getJSON('Comments');

			DEBUG_LOG('Initiating chart with previously stored data:\nLabels [' + labels + '], PlusData [' + plusData + '], MinusData [' + minusData + '], Data Dates [' +  DATA_DATES + '], Comments [' + DAILY_COMMENTS + ']');
			chartData.labels = labels;
			chartData.datasets[PLUS_DATASET].data = plusData;
            chartData.datasets[MINUS_DATASET].data = minusData;

			// TODO: How to keep this from happening? I don't want this function here forever?
			// Previous versions don't contain any comments so we gotta fill up the array
			if(DAILY_COMMENTS == undefined) {
				DAILY_COMMENTS = [];
				DEBUG_LOG("Adding blank comments to graph to compensate for earlier versions");
				for(let i = 0; i < chartData.datasets[MINUS_DATASET].data.length; i++) {
					DAILY_COMMENTS.push(" ");
				}
			}
		}

		var ctx = document.getElementById('canvas').getContext('2d');

		this.chart = new Chart(ctx, {
			type: 'bar',
			data: chartData,
			options: {
				title: {
					display: false,
					text: 'Daily Status'
				},
				legend: {
					display: false,
				},
				tooltips: {
					// mode: 'index',
					// intersect: false,
					bodyFontSize: 36,
					titleFontSize: 18,
			      	callbacks: {
				        title: function(tooltipItem, data) {
				          // console.log("You're hovering on index: " + tooltipItem[0]['index']);
				          return "Comment:";// + data['labels'][tooltipItem[0]['index']];
				        },
				        label: function(tooltipItem, data) {
				          // return data['datasets'][0]['data'][tooltipItem['index']];
				          let index = tooltipItem['index'];
				          return DAILY_COMMENTS[index];
				        },
				        afterLabel: function(tooltipItem, data) {
				          // var dataset = data['datasets'][0];
				          // var percent = Math.round((dataset['data'][tooltipItem['index']] / dataset["_meta"][0]['total']) * 100)
				          // return '(' + percent + '%)';
				        }
		      		}
				},
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					xAxes: [{
						stacked: true,
						ticks: {
							fontSize: 15,
           				}
					}],
					yAxes: [{
						stacked: true,
						ticks: {
							fontSize: 25,
							// TODO: Using const vars since I can't figure out how to access these options
							suggestedMin: Y_AXES_TICKS_SUGGESTED_MIN,
							suggestedMax: Y_AXES_TICKS_SUGGESTED_MAX,
           				}
					}]
				}
			}
		}); // window.chart
	} // constructor

	update() {
		this.chart.update();
	} // update

	isValidInput(nrPlus, nrMinus) {
		// Minor fault handling
		// We must have any valid data for input to the graph
		if(!nrPlus || !nrMinus) { // Javascript "truthy"
			DEBUG_LOG('No valid input data, returning');
			return false;
		} else if(nrPlus == 0 && nrMinus == 0) {
			DEBUG_LOG('No valid input data (nrPlus: 0, nrMinus: 0), returning');
			return false;
		} else if(nrPlus < 0 || nrMinus < 0) {
			DEBUG_LOG('No valid input data (nrPlus < 0 or nrMinus < 0), returning');
			return false;
		}

		if(nrPlus > MAX_DATA_INPUT || nrMinus > MAX_DATA_INPUT) {
			DEBUG_LOG('No valid input data, (nrPlus or nrMinus > MAX_DATA_INPUT(' + MAX_DATA_INPUT + ')), returning');
			return false;
		}

		return true;
	}

	addData(nrPlus, nrMinus, comment) {
		console.log('[INFO] ##### Entering ChartHandler::addData #####');
		DEBUG_LOG("User input, Plus: " + nrPlus + " Minus: " + nrMinus + " Comment: " + comment);

		if(!this.isValidInput(nrPlus, nrMinus)){
			return false;
		}

		// Only show the latest data inputs
		// Only need to check one dataset since they should both be the same length
		if(chartData.datasets[PLUS_DATASET].data.length >= MAX_DATA_LENGTH) {
			DEBUG_LOG('Dataset data is longer than MAX_DATA_LENGTH (' + MAX_DATA_LENGTH + '), removing first datapoint');
			// Remove the label first
			chartData.labels.shift();

			// Remove the first data point
			DATA_DATES.shift();
			chartData.datasets[PLUS_DATASET].data.shift();
			chartData.datasets[MINUS_DATASET].data.shift();
			DAILY_COMMENTS.shift();
		}

		DEBUG_LOG('Todays date: ' + new Date().toISOString().slice(0,10));
		DEBUG_LOG('Label to add: ' + WEEKDAYS[new Date().getDay()]);
		DEBUG_LOG('Plus data  to add: ' + nrPlus);
		DEBUG_LOG('Minus data to add: ' + nrMinus);
		DEBUG_LOG('Comment to add: ' + comment);

		// Overwrite data if adding on the same day (gets date as YYYY-MM-DD)
		if(DATA_DATES[DATA_DATES.length - 1] == new Date().toISOString().slice(0,10)) {
			// Remove last index of array
			DATA_DATES.pop();
			chartData.labels.pop();
			let plusToRemove = chartData.datasets[PLUS_DATASET].data.pop();
			let minusToRemove = Math.abs(chartData.datasets[MINUS_DATASET].data.pop());
			this.setAllTimeStatsCookie(-plusToRemove, -minusToRemove);
			DAILY_COMMENTS.pop();
		}

		this.setAllTimeStatsCookie(nrPlus, nrMinus);

		// Add new data
		DATA_DATES.push(new Date().toISOString().slice(0,10));
		chartData.labels.push(WEEKDAYS[new Date().getDay()]);
		chartData.datasets[PLUS_DATASET].data.push(nrPlus);
		chartData.datasets[MINUS_DATASET].data.push(nrMinus * -1);
		DAILY_COMMENTS.push(comment);

		// Store Data
		DEBUG_LOG('Storing Data Dates: ' + DATA_DATES);
		DEBUG_LOG('Storing labels: ' + chartData.labels);
		DEBUG_LOG('Storing plus dataset: ' + chartData.datasets[PLUS_DATASET].data);
		DEBUG_LOG('Storing minus dataset: ' + chartData.datasets[MINUS_DATASET].data);
		DEBUG_LOG('Storing comment: ' + DAILY_COMMENTS);
		Cookies.set('Data Dates', DATA_DATES);
		Cookies.set('Labels', chartData.labels);
		Cookies.set('PlusData', chartData.datasets[PLUS_DATASET].data);
		Cookies.set('MinusData', chartData.datasets[MINUS_DATASET].data);
		Cookies.set('Comments', DAILY_COMMENTS);

		this.update();
		return true;
	} // addData

	setAllTimeStatsCookie(plus, minus){
		let currentCookie = Cookies.getJSON('AllTimeStatsData');
		let updatedCookie = [2];
		if(currentCookie != undefined){
			updatedCookie[PLUS_INDEX] = Math.max(0, parseInt(currentCookie[PLUS_INDEX]) + parseInt(plus));
			updatedCookie[MINUS_INDEX] = Math.max(0, parseInt(currentCookie[MINUS_INDEX]) + parseInt(minus));

		}else{
			updatedCookie[PLUS_INDEX] = parseInt(0);
			updatedCookie[MINUS_INDEX] = parseInt(0);
		}
		DEBUG_LOG('Storing AllTimeStats data set: ' + updatedCookie);
		Cookies.set('AllTimeStatsData', updatedCookie);
	}

	clear() {
		DATA_DATES = [];
		chartData.labels = [];
		chartData.datasets[PLUS_DATASET].data = [];
		chartData.datasets[MINUS_DATASET].data = [];
		DAILY_COMMENTS = [];
		this.update();
	}
} // class ChartHandler

window.onload = function() {
	// Create new ChartHandler to control the chart, all further operations will be 
	// called using 'window.chartHandler'
	let allTimeStats = Cookies.getJSON('AllTimeStatsData');
	if(allTimeStats != undefined){
		window.statsHandler = new StatsHandler(allTimeStats[PLUS_INDEX], allTimeStats[MINUS_INDEX]);
	}else{
		Cookies.set('AllTimeStatsData', [0, 0]);
		window.statsHandler = new StatsHandler(0, 0);
	}

	resetPostitIndexAllocation();
	createPostitsFromCookies();

	window.chartHandler = new ChartHandler();
}; // window.onload

window.addEventListener("beforeunload", function (e) {
  setPostitCookies();

  //(e || window.event).returnValue = null;
  return null;
});

$(document).ready(function() {

/*	document.getElementById('addRandomData').addEventListener('click', function() {
		console.log('[INFO] ##### Entering function addRandomData #####');

		// Only show the latest data inputs
		// Only need to check one dataset since they should both be the same length
		if(chartData.datasets[PLUS_DATASET].data.length >= MAX_DATA_LENGTH) {
			DEBUG_LOG('Dataset data is longer than MAX_DATA_LENGTH (' + MAX_DATA_LENGTH + '), removing first datapoint');
			// Remove the label first
			chartData.labels.shift();
			// Remove the first data point
			chartData.datasets[PLUS_DATASET].data.shift();
			chartData.datasets[MINUS_DATASET].data.shift();
		}

		let day = WEEKDAYS[WEEKDAY_NR++];
		if(WEEKDAY_NR == (WEEKDAYS.length)) {
			WEEKDAY_NR = 0;
		}
		
		DEBUG_LOG('Current labels: ' + chartData.labels);
		DEBUG_LOG('Weekday to add: ' + day);
		DEBUG_LOG('Plus dataset  before additional data: ' + chartData.datasets[PLUS_DATASET].data);
		DEBUG_LOG('Minus dataset before additional data: ' + chartData.datasets[MINUS_DATASET].data);

		// Add label
		chartData.labels.push(day);
		// Add random data to dataset
		chartData.datasets[PLUS_DATASET].data.push(random());
		chartData.datasets[MINUS_DATASET].data.push(random());

		window.chartHandler.update();
	}); // addRandomData*/

	// Should not be in the customer version
	// document.getElementById('removeData').addEventListener('click', function() {
	// 	if (chartData.labels.length > 0) {
	// 		// Remove last index of arrays
	// 		chartData.labels.pop();
	// 		chartData.datasets[PLUS_DATASET].data.pop();
	// 		chartData.datasets[MINUS_DATASET].data.pop();

	// 		DATA_DATES = Cookies.getJSON('Data Dates');
	// 		let labels = Cookies.getJSON('Labels');
	// 		let plusData = Cookies.getJSON('PlusData');
	// 		let minusData = Cookies.getJSON('MinusData');
	// 		DAILY_COMMENTS = Cookies.getJSON('Comments');

	// 		DATA_DATES.pop();
	// 		labels.pop();
	// 		let removedPlusData = plusData.pop();
	// 		let removedMinusData = Math.abs(minusData.pop());
	// 		DAILY_COMMENTS.pop();

	// 		Cookies.set('Data Dates', DATA_DATES);
	// 		Cookies.set('Labels', chartData.labels);
	// 		Cookies.set('PlusData', chartData.datasets[PLUS_DATASET].data);
	// 		Cookies.set('MinusData', chartData.datasets[MINUS_DATASET].data);
	// 		Cookies.set('Comments', DAILY_COMMENTS);

	// 		window.chartHandler.update();
	// 		window.chartHandler.setAllTimeStatsCookie(-removedPlusData, -removedMinusData);

	// 		let allTimeStatsData = Cookies.getJSON('AllTimeStatsData');
	// 		if(allTimeStatsData != undefined){
	// 			window.statsHandler.setData(Cookies.getJSON('AllTimeStatsData')[PLUS_INDEX], Cookies.getJSON('AllTimeStatsData')[MINUS_INDEX]);
	// 		}
	// 	} else {
	// 		DEBUG_LOG('What data are ypu trying to remove???????');
	// 	}
	// });

	// Should not be in the customer version
	// document.getElementById('deleteStoredData').addEventListener('click', function() {
	// 	if (confirm('Are you sure you want to remove previously saved data?')) {
	// 		DEBUG_LOG('Removing stored data (cookies)');
	// 		Cookies.remove('Data Dates');
	// 		Cookies.remove('Labels');
	// 		Cookies.remove('PlusData');
	// 		Cookies.remove('MinusData');
	// 		Cookies.remove('Comments');
	// 		Cookies.set('AllTimeStatsData', [0, 0]);
	// 		window.chartHandler.clear();
	// 		window.statsHandler.setData(0, 0);
	// 	} else {
	// 		// Do nothing!
	// 	}
	// });

	document.getElementById('addPostit').addEventListener('click', initializePostit);

	document.getElementById('submitData').addEventListener('click', function() {
		submitData();
	}); // submitData

	document.getElementById('plusButton').addEventListener('click', function() {
		addToPlusInput(1);
	});

	document.getElementById('minusButton').addEventListener('click', function() {
		addToMinusInput(1);
	});

	document.getElementById('helpButton').addEventListener('click', function() {
		addHelpPostit();
	});

	// Toggles view when clicking the two canvases
	$(document).ready(function() {
		$('#chart-container').click(function() {
			toggleView();
		});
	});

	$(document).ready(function() {
		$('#stats-container').click(function() {
			toggleView();
		});
	});

	document.getElementById('plusInput').readOnly = true;
	document.getElementById('minusInput').readOnly = true;

	function toggleView(){
		// Update the statsHandler today's data
		let allTimeStatsData = Cookies.getJSON('AllTimeStatsData');
		if(allTimeStatsData != undefined){
			window.statsHandler.setData(allTimeStatsData[PLUS_INDEX], allTimeStatsData[MINUS_INDEX]);
		}else{
			window.statsHandler.setData(0, 0);
		}
		$('#stats-container').toggle();
		$('#chart-container').toggle();
		$('#postit-container').toggle();
		$('#trashcan-container').toggle();
		$('#chart-controls').toggle();
	}

	function submitData(){
		console.log('[INFO] ##### Entering function submitData #####');

		let plus = $('#plusInput').val();
		let minus = $('#minusInput').val();

		// Reset the input
		$('#plusInput').val(0);
		$('#minusInput').val(0);

		let commentOfTheDay;
		if(plus == 0 && minus == 0){
			commentOfTheDay = " ";
		}else{
			commentOfTheDay = prompt("Comment of the Day", getDefaultCommentOfTheDay(plus, minus));
		}
		window.chartHandler.addData(plus, minus, commentOfTheDay);
	}

	function getDefaultCommentOfTheDay(plus, minus){
		let commentOfTheDay;
		if(plus > minus){
			if(minus == 0){
				commentOfTheDay = "Euphoric Day";
			}else{
				commentOfTheDay = "Good Day";
			}
		}else if(minus > plus){
			commentOfTheDay = "Bad Day";
		}else{
			commentOfTheDay = "Neutral Day";
		}
		return commentOfTheDay;
	}

	function addToPlusInput(addedValue) {
		let nrPlus = $('#plusInput').val();
		if(nrPlus == 0 && addedValue < 0){
			return;
		}
		nrPlus = parseInt(nrPlus) + parseInt(addedValue);
		$('#plusInput').val(nrPlus);
	}

	function addToMinusInput(addedValue) {
		let nrMinus = $('#minusInput').val();
		if(nrMinus == 0 && addedValue < 0){
			return;
		}
		nrMinus = parseInt(nrMinus) + parseInt(addedValue);
		$('#minusInput').val(nrMinus);
	}

	/* Handler for shortcuts, currently 'w' and 'shift+w'
	 * to increase/decrease plusInput, 'e' and 'shift+e'
	 * to increase/decrease minusInput, and 's' to submitData.
	 *
	 * To see all time stats, 'r' or left click on chart
	 */
	function doc_keyUp(e) {
		// Do not allow editing if in the wrong view
		checkForCode(e.keyCode);
		let activeElement = document.activeElement.tagName.toLowerCase();
		if(activeElement === "textarea"){
			return;
		}
		if(document.getElementById("canvas").style.display !== "none"){
			switch(e.keyCode) {
				case 87/*w*/:
					if(e.shiftKey){
						addToPlusInput(-1);
					}else{
						addToPlusInput(1);
					}
					break;
				case 69/*e*/:
					if(e.shiftKey){
						addToMinusInput(-1);
					}else{
						addToMinusInput(1);
					}
					break;
				// shortcut 's' will submitData
				case 13/*enter-key*/:
				case 83/*s*/:
					submitData();
					break;
				case 80/*p*/:
					initializePostit();
					break;
				default:
					break;
			}
		}

		// Toggle view with 'r'
		if(e.keyCode == 82/*r*/){
			toggleView();
		}
	}

	function checkForCode(input){
		if(input == secretCode[secretCodeIndex]){
			secretCodeIndex++;
			if(secretCodeIndex == secretCode.length){
				document.getElementById('secretSound').preload="auto";
				document.getElementById('secretSound').volume = 0.1;
				document.getElementById('secretSound').play();
				alert("Congrats u found code!!!");
				secretCodeIndex = 0;
			}
		}else{
			secretCodeIndex = 0;
		}
	}

	document.addEventListener('keyup', doc_keyUp, false);

	// document.getElementById('randomizeData').addEventListener('click', function() {
	// 	console.log('[INFO] Entering function randomizeData');
	// 	var zero = Math.random() < 0.2 ? true : false;
	// 	chartData.datasets.forEach(function(dataset) {
	// 		dataset.data = dataset.data.map(function() {
	// 			return zero ? 0.0 : random();
	// 		});

	// 	});
	// 	window.chart.update();
	// });

	// // var colorNames = Object.keys(window.chartColors);
	// document.getElementById('addDataset').addEventListener('click', function() {
	// 	console.log('[INFO] Entering function addDataset');

	// 	// var colorName = colorNames[chartData.datasets.length % colorNames.length];
	// 	// var dsColor = window.chartColors[colorName];
	// 	var newDataset = {
	// 		label: 'Dataset ' + (chartData.datasets.length + 1),
	// 		// backgroundColor: color(dsColor).alpha(0.5).rgbString(),
	// 		// borderColor: dsColor,
	// 		borderWidth: 1,
	// 		data: []
	// 	};

	// 	for (var index = 0; index < chartData.labels.length; ++index) {
	// 		newDataset.data.push(random());
	// 	}

	// 	chartData.datasets.push(newDataset);
	// 	window.chart.update();
	// });

	// document.getElementById('removeDataset').addEventListener('click', function() {
	// 	console.log('[INFO] Entering function removeDataset');

	// 	chartData.datasets.pop();
	// 	window.chart.update();
	// });

	// document.getElementById('removeData').addEventListener('click', function() {
	// 	console.log('[INFO] Entering function removeData');

	// 	chartData.labels.splice(-1, 1); // remove the label first

	// 	chartData.datasets.forEach(function(dataset) {
	// 		dataset.data.pop();
	// 	});

	// 	window.chart.update();
	// });

}); // $(document).ready(function() {
