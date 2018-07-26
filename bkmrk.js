$(function(){

	//Check if storage possible then give option to add the bookmarks otherwise throw error
	try {

		if (typeof(Storage) == "undefined") {
			throw 'No storage support, cannot use the app';
		} else {

			//Show bookmarks in the storage
			showBookmarks();
		}

	} catch(e) {

		//Hide add and search card
		$('#add-card, #search-card').hide();
		
		//Show message on the bookmarks result
		$('#bookmarks').html(`<div class="alert alert-danger">${e}</div>`);
	}

	//Add a bookmark
	$('#add').click(function(){

		try {

			//Get the category and url
			let category = $('#category').val();
			let url = $('#url').val();
			let name = $('#name').val();
			
			//Set up default category 
			if( category == '' ){
				category = 'General';
			}
			if( url == '' || name == '' ){
				throw 'Name or URL is missing';
			}

			let result = insertBookmark( category, url, name );
			
			$('#category').val('');
			$('#url').val('');
			$('#name').val('');

		} catch(e){

			//If any error show the alert
			$('#add-card').find('.alert').remove();
			$('#add-card .card-body').prepend(`<div class="alert alert-danger">${e}</div>`)

		}

	});

	//function to add bookmark in local storage
	function insertBookmark( category, url, name ){
		
		let bookmarks = {};
		
		//Get the bookmarks 
		bookmarks = localStorage.getItem( 'bookmarks' );

		// CHeck if there is any data in bookmarks or not
		if( bookmarks != null && bookmarks != 'null' && bookmarks != '' ){

			//parse current data
			bookmarks = $.parseJSON(bookmarks);
			
			let exists = false;

			//For each category in the bookmarks
			for( bookmark in bookmarks){
				
				//If category already exists in the storage
				if( category == bookmark ){
					
					//Set the flag to true
					exists = true;
				}

			}

			//If category does not exists
			if( !exists ){

				//Create the category
				bookmarks[category] = [];
			}

		} else {

			//Initialize bookmarks object
			bookmarks = {};
			
			//Add first key
			bookmarks[category] = [];
			
		}

		//At this point, one way or another, we have basic db setup to add the url to a specific category
		bookmarks[category].push({
			'name': name,
			'url': url
		});

		//Add in the local storage
		localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

		//Display on page
		showBookmarks();

	}

	//Display bookmarks
	function showBookmarks(){

		let bookmarks = {};
		let displayHTML = '';
		
		//Get the bookmarks 
		bookmarks = localStorage.getItem( 'bookmarks' );

		// If bookmarks exits and has data
		if( bookmarks != null && bookmarks != 'null' && bookmarks != '' ){

			bookmarks = $.parseJSON( bookmarks );
			$('#categories').html('');

			//List all bookmarks by categories
			for( bookmark in bookmarks ){

				//Add the category to the category list for autocomplete
				$('#categories').append(`<option value="${bookmark}"></option>`)
				
				//check if the current category is not empty
				if( bookmarks[bookmark].length > 0 ){
					
					//Display the Category
					displayHTML += `<p class="lead text-right mt-5">${bookmark}</p>`;
				}	
				//For each bookmark in the current category add in the list
				for( bkmrk of bookmarks[bookmark]){
					displayHTML += `
						<span class="bkmrk-link mr-5" data-name="${bkmrk.name}" data-url="${bkmrk.url}">
							<a target="_blank" href="${bkmrk.url}">${bkmrk.name}</a>
							<i class="fas fa-trash-alt del-bkmrk text-danger float-right" data-name="${bkmrk.name}" data-category="${bookmark}"></i>
						</span>
					`;
				}
					
			}

		} else {

			//display error message
			displayHTML += `<div class="alert alert-info">There are no bookmarks stored.</div>`;

		}

		$('#bookmarks').html( displayHTML );


	}

	//Delete a bookmark
	$(document).on('click','.del-bkmrk', function(){

		//Get bookmark name and category
		let bname = $(this).data('name');
		let bcat = $(this).data('category');
		let bookmarks = {};
		
		//Get the bookmarks 
		bookmarks = localStorage.getItem( 'bookmarks' );

		//parse current data
		bookmarks = $.parseJSON(bookmarks);
		
		newArr = jQuery.grep(bookmarks[bcat], function(value) {
			return value.name != bname;
		});

		bookmarks[bcat] = newArr;

		//Update storage with new values
		localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

		//display updated storage
		showBookmarks();

	});

	//search for bookmarks
	$('#search').keyup(function(){

		let query = $(this).val().toLowerCase();
		
		//If query empty remove the search container
		if( query == '' && $('#search-container').length > 0 ){
			$('#search-container').remove();
		}

		//If there is no search container, add one
		if( $('#search-container').length <= 0 && query != ''){
			
			//Add a search container
			searchContainerHTML = '';

			searchContainerHTML += `
				<div id="search-container" class="mb-5">
				</div>
			`;
			$('#search-form').append(searchContainerHTML);
		} else {

			$('#search-container').html('');
		}

		//Search in bookmarks
		$('#bookmarks .bkmrk-link').each(function(){

			let bname = $(this).data('name').toLowerCase();
			let burl = $(this).data('url').toLowerCase();

			if( burl.indexOf(query) != -1 || bname.indexOf(query) != -1 ){

				let link = $(this).clone();
				link.find('.del-bkmrk').remove();
				link.removeClass('mr-5');

				$('#search-container').append(link);

			}

		});

	});

	//Create a backup
	$('#btn-backup').click( function() {

		//Get data
		let bookmarks = localStorage.getItem( 'bookmarks' );
		
		//Download the file
		download( 'bookmarks.json', bookmarks );

	});

	//Download function
	function download( fname, fdata ){
		let element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fdata));
		element.setAttribute('download', fname);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}

	//Show restore form
	$('#btn-restore').click( function() {

		if( !$('#restore-form').length ) {
			
			//Create form 
			let restoreForm = `
				<div id="restore-form" class="mt-4 text-primary">
					<input type="file" name="restore" id="restore" class="d-none">
					<label for="restore" class="border p-2"><span>Choose a file…</span></label>
				</div>
			`;

			$( this ).parent().append( restoreForm );
		}

	});

	let uploadedFile = '';

	//Show file name on file input value change
	$( document ).on( 'change', '#restore', function( e ) {

		let restoreForm = $('#restore-form');

		//Get file name
		uploadedFile = e.target.files[0];

		//Get the extension
		let type = uploadedFile.type;

		//Show file name
		restoreForm.find( 'label' ).text( uploadedFile.name );
	
		//If extention is not json throw error
		if( type !== 'application/json' ) {

			//If not json, show error
			restoreForm.removeClass( 'text-primary' ).addClass( 'text-danger' );
			if( !$('span.error').length ){
				restoreForm.find( 'label' ).after( '<span class="d-block error"><i class="fas fa-exclamation"></i> Invalid file, try again</span>' );
			}

		} else {

			//prepare the form to restore, add a button for restore action
			restoreForm.removeClass( 'text-primary text-danger').addClass( 'text-success' );
			restoreForm.find( '.error' ).remove();
			
			restoreForm.append( '<button class="btn btn-restore-data btn-success">Restore</button>');
		}

	});

	//Actual restoration of the bookmarks data
	$( document ).on( 'click', '.btn-restore-data', function() {

		//REad the data from the file uplaoded
		let reader = new FileReader();
		let dataToRestore = '';
		reader.onload = function( theFile ){
			dataToRestore = reader.result;

			//Restore data
			localStorage.setItem('bookmarks', dataToRestore);
			showBookmarks();

			//remove the form
			$('#restore-form').remove();
		};

		//On error show the error
		reader.onerror = function( theFile ){

			$('#restore-form').removeClass('text-priamry text-danger').addClass('text-danger');
			if( !$('span.error').length ){
				$('#restore-form').find( 'label' ).after( '<span class="d-block error"><i class="fas fa-exclamation"></i> Invalid file data, try again</span>' );
			}
			
		}

		//Read file
		reader.readAsText( uploadedFile );

	});

});