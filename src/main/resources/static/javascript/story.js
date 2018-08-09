// we want to globally use our firebase
let fire;

// initialize counter for storyblock-elements
let count = 0;


$(document).ready(function() {
	// generate and set ID-Cookie for this walkthrough
	// IDs will be generated on every page load
	// this is intended, since we don't want session info
	// but per-walkthrough info
	let my_uuid = uuid();
	Cookies.set('scoutsession', my_uuid, { expires: 1 });
	
	// get DB-Instance
	fire = firebase.database();
	
	// create our first StoryBlock
	// Hard-Coded in our example, can be easily replaced 
	// with a dynamic selection from multiple stories in the future
	appendStoryBlock("Awakening");
});

// takes an ID as parameter and creates and renders a storyblock from that
function appendStoryBlock(id) {
	
	// get relevant info from DB and JSONify it
	let block = fire.ref('StoryBlocks/' + id).once('value').then(function(storyblock) {
		block = storyblock.toJSON();
		
		// create a new element and append it to the container
		$('#story-container').append(
				"<div id='" + id + "-card' class='card' '>" +
				"<div class='card-body'>" +
					"<div class='card-text'>" + block.text + "</div>" +
						"<button id='first-" + block.reaction1id + count + "' class='btn btn-info'>" + block.reaction1text + "</button>" +
						"<button id='second-" + block.reaction2id + count + "' class='btn btn-info'>" + block.reaction2text + "</button>" +
					"</div>" +
				"</div>"
		);
		
		// Register all tooltips
		$('[data-toggle="tooltip"]').tooltip(); 
		
		// autoscroll
		let elem = $('#' + id + '-card');
		if(elem) {
		    $('html').scrollTop(elem.offset().top);
		    $('html').scrollLeft(elem.offset().left);
		}
		
		// register the click handler
		$('#first-' + block.reaction1id + count).click(function() {
			
			// statistics-stuff happens here, getting the walkthrough ID from our cookie
			// to submit the ID + stats on every DB interaction (so we can also track early quits and decision times)
			let session = Cookies.get('scoutsession');
			
			// timestamp the current date in seconds
			let timestamp = Math.floor(Date.now() / 1000);
			
			// we track the path of choices as "from-to" pairs, coupled with a timestamp
			let choice = {
					"attimestamp" : timestamp,
					"from" : block.id,
					"to" : block.reaction1id
			}
			
			// we also track the step of the story that the choice was made at
			// because of technical limitations, we need to sanitize our count integer into
			// a string that can be utilized better in our backend service
			let sanitized_count = sanitize(count);
			fire.ref('statistics/' + session + '/step' + sanitized_count).set(choice).then(function() {
				
				// because the decisions can only be made once, we disable the buttons
				// of a storyblock, when a decision has been made
				$('#first-' + block.reaction1id + count).prop("disabled", true);
				$('#second-' + block.reaction2id + count).prop("disabled", true);
				
				// we need to iterate our counter, because a new block is about to be appended
				// and finally append the chosen storyblock
				count++;
				appendStoryBlock(block.reaction1id);
			});
			
		});
		
		// the second button works just the same. we chose to not externalize
		// most of the functionality in order to improve readability.
		// this is a trade-off against better maintainability we decided to make
		$('#second-' + block.reaction2id + count).click(function() {
			let session = Cookies.get('scoutsession');
			
			let timestamp = Math.floor(Date.now() / 1000);

			let choice = {
					"attimestamp" : timestamp,
					"from" : block.id,
					"to" : block.reaction2id
			}
			
			let sanitized_count = sanitize(count);
			fire.ref('statistics/' + session + '/step' + sanitized_count).set(choice).then(function() {
				$('#first-' + block.reaction1id + count).prop("disabled", true);
				$('#second-' + block.reaction2id + count).prop("disabled", true);
				
				count++;
				
				appendStoryBlock(block.reaction2id);
			});
		});
	});
}

// helper function to generate uuids
function uuid() {
	  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	  )
}

// to be able to sort by our numbers, we need to prepend zeros
// if the number is below 10 and 100
function sanitize(num) {
	if(num < 10) {
		let san_num = "00" + num;
		return san_num;
	}
	if(num < 100) {
		let san_num = "0" + num;
		return san_num;
	} else {
		return num;
	}
	
}