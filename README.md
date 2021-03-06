# Command Scraper

**A command line approval based web scraper.**

> A side note about web scraping. Always check the Terms of Service on a website if you're going to attempt to scrape it's content. The owner may not want their site and bandwidth touched by scraping so be mindful, and respect peoples wishes. If unsure, drop the website owner an email :)

## What it does

The **command-scraper** searches a specified website for images and returns them to the user in web browser window, one-by-one, allowing the user to approve the images via the terminal which will then produce an action on the approved image (such as save to a database/file system).

The app will create a directory called public if one doesn't exist, and have this set as a place to serve static files.

As the user is scraping images, they will be saved temporarily to a directory inside the public directory called temp. The contents of this directory is automatically emptied once all images have been scraped and reviewed.

On approval of an image, the package will request the image from the temporary directory and write the same image to a user-specified permanent directory.

On each sucesfull approved image write, a callback function will be called, passing in the permanent image URL, so tasks such as DB updates can be made in accordance with the image write.

**Note: currently the app is best ran on a local environment. Updates coming to allow integration with a remote system**.

## Install

`npm i command-scraper`

## The function

<pre>
// 1. URL to scrape
// 2. parent class to search for
// 3. image class to search for within parent
// 4. permanent directory to save scraped image
// 5. should the package open a new browser window automatically (true/false)
// 6. callback function returned on each successful save

scraper(
  urlToScrape,
  searchParentClass,
  searchImageClass,
  permanentSaveDirectory,
  openNewWindow,
  successfulSaveCallback(savedImageUrl)
);

</pre>

## Example usage

To run the **command-scraper** in a Node project, simply include the package into a Node instance and run the package. There's no need to set up a server or socket info as all this is done in the package:

<pre>
//scraper.js

var scraper = require('command-scraper');

scraper(
  'http://www.someurl.com',
  '.imageWrap',
  '.img',
  'public/savedImages',
  true,
  function(imageUrl){
    //save to DB
  }
);

</pre>

Then simply:

`node scraper.js`

## To do

* Allow process to be ran on remote system (such as Heroku)
* Make image selectors more flexible (i.e. not have it limited to parent/child searches)
* Enable selecting and parsing of more than only images
* Update so scraper can be ran from the CLI rather than just embeded in a function
