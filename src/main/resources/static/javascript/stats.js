// global instance of our database
let fire = firebase.database();
let stats = fire.ref('/statistics/');

// on page load, get a real-time-database-handler
$(document).ready(function() {
	stats.on('value', function(currentStats) { // this is called once and after that each time, the DB receives an update
		
		let mappedData = mapData(currentStats);	// map the data coming from our DB in a more usable format
		
		/* Create / Update all plotly-plots and the table */
		Plotly.newPlot('chart1', getTimesAtBlock(mappedData), {xaxis: {title: "StoryBlock"}, yaxis: {title: "Time spent in Seconds"}});
		Plotly.newPlot('chart2', getPathInfo(mappedData), {xaxis: {title: "# of step"}, yaxis: {title: "StoryBlock"}, showlegend: false});
		Plotly.newPlot('chart3', [getStepData(mappedData)], {xaxis: {title: "# of step"}, yaxis: {title: "# of exits"}});
		Plotly.newPlot('chart4', [getBurryData(mappedData)]);
		makeTable(mappedData);
	});
	
	$('#download-btn').click(function(e) {
		e.preventDefault();
		// if, someday, we manage to implement this, we will be very happy
		alert("I'm only a placeholder, sorry");

	});
		
		
});

// creates a simple HTML table from our input-data
function makeTable(data) {
	let i = 0;
	
	// using plain JS here, since it is easier to write (and read)
	// than jQuery in this case.
	let table = document.getElementById("data-table");
	table.innerHTML = "";

	// fill the table with data
	while(i < data.length) {
		let row = table.insertRow(i);
		
		for(let j = 0; j < 30; j++) {
			let cell = row.insertCell(j);
			
			if(j < data[i].length) {
				if(j == 0) {
					cell.innerHTML = "#" + i;
				} else {
					cell.innerHTML = data[i][j].on;
				}
			} else {
				cell.innerHTML = "-";
			}
		}
		i++;
	}
	
	// create the table-head
	let firstrow = table.insertRow(0);
	for(let i = 0; i < 25; i++) {
		cell = firstrow.insertCell(i);
		if(i == 0) {
			cell.innerHTML = "<b>#</b>";
		} else {
			cell.innerHTML = "<b>Step&nbsp;" + i + "</b>";
		}

	}
}

// make a pie chart of how many people burried tommy
function getBurryData(data) {
	let burried = 0;	// number of people who burried poor tommy
	let rotten = 0;		// number of people who left poor tommy to rot in the dirt
	let n = 0;			// number of people who made the decision overall
						// could be computed by adding burried + rotten but hey, KISS-Development aight?
		
	
	let i = 0;
	
	// for all walkthroughs
	while(i < data.length) {
		
		let j = 1;
		
		// go through all steps
		while(j < data[i].length){
				if(data[i][j].next == "TommyBuried") {
					burried++;
					n++; 		// only increase n, if user has reached this decision
				} if(data[i][j].next == "LeaveTommy") {
					rotten++;
					n++;
				}
			
			j++;
		}
		
		i++;
	}
	
	let noAnswer = (data.length-n);	// maybe also interesting
	
	/* Plotly-Configuration */
	let pie = {
			values: [burried, rotten, noAnswer],
			labels:["Burried Tommy", "Left Tommy to rot", "Did not answer"],
			type: "pie"
	}
	
	return pie;	//and this cake is no lie, I promise
}

// gets the number of steps after that a walkthrough ended
function getStepData(data) {
	let steps = [];
	
	let i = 0;
	while(i < data.length) {
		let length = data[i].length - 1;	// don't count IDs
		steps.push(length);
	
		i++;
	}
	
	/* Plotly-Configuration */
	let stepData = {
			histfunc: 'count',
			autobinx: false, 
			x: steps,
			type: 'histogram',
			xbins: {
				end: 30, 
			    start: 0, 
			    size: 1 
			}
	}
	
	return stepData;
}

// get path information per walkthrough
function getPathInfo(data) {
	let walkAndPath = [];
	
	let i = 0;
	while(i < data.length) {
		
		let j = 1;
		let blocks = [];
		let steps = [];
		while(j < data[i].length) {
			steps.push(data[i][j].step);		
			blocks.push(data[i][j].on);
			
			j++;
		}
		
		/* Plotly-Configuration */
		let path = {
				x: steps,
				y: blocks,
				mode: 'lines',
				name: data[i][0]
		}
		walkAndPath.push(path);
		
		i++;
	}
	
	return walkAndPath;
	
}

// transform data to represent the times spent at blocks
function getTimesAtBlock(data) {
	let blockAndTimes = [];
	
	let i = 0;
	while(i < data.length) {
		
		let j = 1;
		while(j < data[i].length) {
					
			// check if this block already has a list of values
			if(typeof blockAndTimes[data[i][j].on] == "object") {		
				// if there is a list, just append the new duration
				blockAndTimes[data[i][j].on].y.push(data[i][j].duration);
			} else {
				// in case the block doesn't have a list, create one
				let boxplot = {
						y: [data[i][j].duration],
						type: 'box',
						name: data[i][j].on
				}
				blockAndTimes[data[i][j].on] = boxplot;
				// blockAndTimes[data[i][j].on] creates/references a named index
				// the current block-id is chosen as index-name, so duplicates are
				// prevented in an efficient manner
			}
			
			j++;
			
		}
		
		i++;
		
	}
	
	// convert the named index array to a numbered index array
	// so it works with plotly
	blockAndTimes = makeNumberedArray(blockAndTimes);
	
	// return the generated data
	return blockAndTimes;
}

// save data in a better data structure to work with locally
function mapData(currentStats) {
	
	let dataMap = [];
	let i = 0;
	
	// iterate over all walkthrough-ids
	currentStats.forEach(function(id) {
		
		let columns = [];
		columns[0] = id.key;	// reserve the first row for IDs only
		
		let j = 1;
		let lasttimestamp = 0;
		
		// iterate over all steps taken in the walkthrough
		id.forEach(function(step) {
			let stepnum = parseInt(step.key.substring(4));
			step = step.toJSON();
			
			// calculate the duration in seconds that was spend on
			// the current step
			let duration = step.attimestamp - lasttimestamp;
			
			// filter out entry-blocks (that have a timestamp but cannot be properly evaluated)
			// loading times are disregarded, and should not matter (hopefully)
			if (duration > 604800) {			// one week in seconds
				duration = 0;					// set the duration at the first block to zero
			}
			lasttimestamp = step.attimestamp;	// update lasttimestamp to the current one
			
			// pack all relevant data in a new object 
			// and assign clearer and shorter names
			let strip = {
					"on" : step.from,
					"duration" : duration,
					"next" : step.to,
					"step" : stepnum
			}
			
			// save the generated data and move on to the next step
			columns[j] = strip;
			j++;
		});
		
		// save the generated data and move on to the next ID
		dataMap[i] = columns;
		i++;
	});
	
	// return the generated dataMap
	return dataMap;
}

//helper function to create a numbered array from a named array
function makeNumberedArray(namedArray) {
	let numberedArray = [];
	for(let item in namedArray) {
		numberedArray.push(namedArray[item]);
	}
	return numberedArray;
}

