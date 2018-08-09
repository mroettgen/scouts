// global instance of our database
let fire = firebase.database();

// update our list and bind the button event on page-load
$(document).ready(function(){
	updateList();
	
	// Event-Handler for our form-submit
	$("#storyblock-form").submit(function(e) {
		e.preventDefault();			
		
		// create a new storyblock-object from the form-contents
		let storyblock = {
			"id" : $(this).children('#id').val(),		
			"text" : $(this).children('#text').val(),
			"reaction1id" : $(this).children('#reaction1id').val(),
			"reaction1text" : $(this).children('#reaction1text').val(),
			"reaction2id" : $(this).children('#reaction2id').val(),
			"reaction2text" : $(this).children('#reaction2text').val()
		}
		
		// save the storyblock in our database
		fire.ref('/StoryBlocks/' + $(this).children('#id').val()).set(storyblock);
		
		// clear the form
		resetForm();
		
		// update the list to show new elements
		updateList();
	});
	
	
	// Event-Handler for our Cancel-Button
	$('#cancel-btn').click(function(e){
		e.preventDefault();
		
		// clear the form
		resetForm();
	});
});

// function to update the list of existing or referenced storyblocks
function updateList() {
	// get all storyblocks from db
	fire.ref('/StoryBlocks/').once('value').then(function(allStoryBlocks) {
		
		// save all IDs (existing and referenced) in a new Set
		// Set has the useful property that it can only contain unique items
		// so we don't have to worry about duplicate IDs 
		// (e.g. when an existing id is already being referenced)
		let storyBlockIdList = new Set([]);
		allStoryBlocks.forEach(function(storyBlock) {
			storyBlockIdList.add(storyBlock.toJSON().id);			// add existing ID
			storyBlockIdList.add(storyBlock.toJSON().reaction1id);	// add first referenced ID
			storyBlockIdList.add(storyBlock.toJSON().reaction2id);	// add second referenced ID
		});
		
		// from our Set, we now generate a HTML list, where an ID can be selected
		storyBlockListHTML = "<div id='ids' class='list-group'>"
		storyBlockIdList.forEach(function(block_id) {
			storyBlockListHTML += "<button type='button' class='list-group-item list-group-item-action'>" + block_id + "</button>\n";
		});
		storyBlockListHTML += "</div>";
		
		// finally, render the updated HTML in the container-div
		$('#existing-id-container').html(storyBlockListHTML);
		
		// to enable functionality, we create/update the event handlers in our
		// list of buttons. This is done via delegated binding, which requires
		// this (different and slightly less readable) approach to adding an
		// event-listener.
		$('.list-group').on('click', '.list-group-item', function(e) {
			e.preventDefault();
			
			// since the text of our button already has the next id, we can simply get it this way
			let block = $(this).text();
			
			// load the storyblock-data from our database and convert to JSON
			fire.ref('StoryBlocks/' + block).once('value').then(function(storyblock) {
				storyblock = storyblock.toJSON();
				
				if(storyblock != null) {
					
					// if the storyblock exists in our database, we can fill our
					// form with data and allow the user to edit
					$('#storyblock-form').children('#id').val(storyblock.id);
					$('#storyblock-form').children('#text').val(storyblock.text);
					$('#storyblock-form').children('#reaction1id').val(storyblock.reaction1id);
					$('#storyblock-form').children('#reaction1text').val(storyblock.reaction1text);
					$('#storyblock-form').children('#reaction2id').val(storyblock.reaction2id);
					$('#storyblock-form').children('#reaction2text').val(storyblock.reaction2text);
					$('#storyblock-form').children('#id').prop('disabled', true);
					
				} else {
					
					// if the block is not yet fully written but only referenced, we 
					// clear all inputs and set only the ID
					resetForm();
					$('#storyblock-form').children('#id').val(block);
					$('#storyblock-form').children('#id').prop('disabled', true);
				}
				
			});				
		});
	});			
	
}

// helper function to clear all inputs and enable editing of all fields
function resetForm() {
	// enable the ID-field if it was disabled before
	$(this).children('#id').prop('disabled', false);
	
	// clear all forms
	$('#storyblock-form').children('#id').val('');
	$('#storyblock-form').children('#text').val('');
	$('#storyblock-form').children('#reaction1id').val('');
	$('#storyblock-form').children('#reaction1text').val('');
	$('#storyblock-form').children('#reaction2id').val('');
	$('#storyblock-form').children('#reaction2text').val('');
}

