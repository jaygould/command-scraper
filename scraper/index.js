const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const request = require('request');
const Jimp = require('jimp');
const shortid = require('shortid');
const inquirer = require('inquirer');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const tempDir = 'public/temp';

let emptyTemp = () => {
	if (fs.existsSync(tempDir)) {
		return new Promise((resolve, reject) => {
			fs.readdir(tempDir, (err, files) => {
				try {
					if (err) throw err;
					for (const file of files) {
						fs.unlink(path.join(tempDir, file), err => {
							if (err) throw err;
							resolve();
						});
					}
				} catch (err) {
					reject(err);
				}
			});
		});
	}
};

process.on('SIGINT', function() {
	emptyTemp().then(() => {
		process.exit();
	});
});

//io: socket inatance passed in from the main index.js file

//req: request object passed in from the main indx.js file which is passed
//down to functions to give them access to the current host headers

//callback: callback function passed in from the main index.js file which
//enables the user to respond to a sucesfull image scrape (perhaps a DB save)

exports.scrapeFn = (io, req, callback) => {
	const url = global.url;
	const parentElement = global.parentElement;
	const childElement = global.childElement;
	request(url, function(error, response, html) {
		if (!error) {
			var $ = cheerio.load(html);
			let photos = [];
			//const imgWraps = $('.photos').children();
			$(parentElement).each((i, elem) => {
				//if ($(elem).attr('class') == 'photo-item') {
				let url = $(elem)
					.find(childElement)
					.attr('src');
				photos.push(url);
				//}
			});
			let prom = Promise.resolve();
			let promArr = [];
			photos.forEach(photo => {
				prom = prom.then(function() {
					return getUserApproval(photo, io, req, callback);
				});
				promArr.push(prom);
			});

			Promise.all(promArr).then(() => {
				//delete all images in temp directory
				emptyTemp()
					.then(() => {
						console.log(
							'%s all images have been processed.',
							chalk.green('Success: ')
						);
					})
					.catch(e => {
						console.log(
							'%s the target directory or file may not exist. Please check the parameters of the function or delete the temporary files manually.',
							chalk.red('Failed: ')
						);
					});
			});
		}
	});
};

let getUserApproval = (remoteUrl, io, req, callback) => {
	return new Promise((resolve, reject) => {
		_convertImage(remoteUrl)
			.then(newUrl => {
				console.log(newUrl);
				let urlArr = newUrl.split('public');
				let absUtl = `http://${req.headers.host}/${urlArr[1]}`;
				//send image to browser
				console.log(absUtl);

				io.emit('img', { imageUrl: absUtl, imageName: urlArr[1] });

				//begin user input into terminal
				var question = [
					{
						type: 'confirm',
						name: 'keepImage',
						message: 'Keep image?',
						default: false
					}
				];
				inquirer.prompt(question).then(function(answers) {
					if (answers.keepImage) {
						return _saveImage(absUtl, newUrl => {
							callback(newUrl);
							resolve('saved');
						}).catch(err => {
							console.log(
								'%s there has been a problem with the image save process. Please check the directories for temporary and permanent image saving are writabe and correct.',
								chalk.red('Failed: ')
							);
						});
					}
					//resolve and move to next question
					resolve('skipped');
				});
			})
			.catch(e => {
				console.log(
					'%s there has been a problem with the image conversion. Please check the images or content you\'re scraping',
					chalk.red('Failed: ')
				);
				console.log(e);
			});
	});
};

const _convertImage = remoteUrl => {
	return new Promise((resolve, reject) => {
		Jimp.read(remoteUrl)
			.then(function(img) {
				//files are initially saved to a temporary diretory so they can be
				//discarded afterwards
				let newUrl = `${tempDir}/${shortid.generate()}.png`;
				img.resize(600, Jimp.AUTO).write(newUrl, () => {
					resolve(newUrl);
				});
			})
			.catch(function(err) {
				reject(err);
			});
	});
};

const _saveImage = (url, cb) => {
	const permanentDir = global.permanentDir;
	return new Promise((resolve, reject) => {
		mkdirp(permanentDir, err => {
			if (err) reject(err);
			let urlSplit = url.split('/');
			let imgUrl = `${permanentDir}/${urlSplit[urlSplit.length - 1]}`;

			request.get({ url: url, encoding: 'binary' }, (err, response, body) => {
				if (err) reject(err);
				fs.writeFile(imgUrl, body, 'binary', err => {
					if (err) reject(err);
					console.log('%s ' + imgUrl, chalk.green('Written: '));
					cb(imgUrl);
				});
			});
		});
	});
};
