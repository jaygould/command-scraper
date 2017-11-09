const http = require('http');
const connect = require('connect');
const fs = require('fs');
const path = require('path');
const serveStatic = require('serve-static');
const opn = require('opn');
const scrape = require('./scraper/index');
const app = connect();

const port = 3033;

module.exports = (
	url,
	parentElement,
	childElement,
	permanentDir,
	isLocal,
	callback
) => {
	global.url = url;
	global.parentElement = parentElement;
	global.childElement = childElement;
	global.permanentDir = permanentDir;
	app.use(serveStatic(process.cwd() + '/public'));
	console.log(process.cwd() + '/public');
	let server = http.createServer(app).listen(port, err => {
		if (isLocal) {
			opn('http://localhost:' + port + '/scrape');
		}
		if (err) {
			return console.log('Error: ', err);
		}
		console.log(`Success: server is listening on ${port}`);
	});
	const io = require('socket.io')(server);

	app.use((req, res) => {
		if (req.url == '/scrape') {
			res.writeHead(200, { 'Content-Type': 'text/html' });
			fs
				.createReadStream(path.resolve(__dirname + '/scraper/scrape.html'))
				.pipe(res);

			scrape.scrapeFn(io, req, callback);
		}
	});

	// io.on('connection', socket => {
	// 	console.log('Connected...');
	// 	socket.on('disconnect', function() {
	// 		console.log('Disconnected.');
	// 	});
	// });
};
