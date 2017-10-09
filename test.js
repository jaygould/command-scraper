var scraper = require('./index.js');

// 1. URL to scrape
// 2. parent class to search for
// 3. image class to search for within parent
// 4. permanent directory to save scraped image
scraper(
	'https://www.pexels.com/search/pet/',
	'.photo-item',
	'.photo-item__img',
	'public/catImages',
	function(imgUrl) {
		//image saved
	}
);
