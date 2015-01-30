
// Restify docs: http://mcavage.me/node-restify/
// Mongoose and Geospatial: http://askmike.org/2013/01/how-to-use-geospatial-indexing-in-mongo-using-nodejs-and-mongoose/
// MongoDb create Geospatial index: http://docs.mongodb.org/manual/tutorial/build-a-2d-index/
// NPM: mongoose, restify, filed, mongodb, node-uuid


var filed = require('filed');
var restify = require('restify');
var mongoose = require('mongoose');
var uuid = require('node-uuid');
var nstokens = require('node-session-tokens');
var tokens = new nstokens();

var profileImageBasePath = '/Users/dsandor/';

var db = mongoose.connection;

var models = require('./offer.js')(mongoose);

mongoose.connect('mongodb://localhost/ln');

tokens.createSession(function (response) {
	console.log('createSession response: %j', response);

	tokens.validateSession(response.sessionToken, 1, function(validationResponse) {
		console.log('validateSession response: %j', validationResponse);

		/*auth.destroySession(response.sessionToken, function() {
			console.log('destroyed session: %s', response.sessionToken);
		});*/
	});

});

function PostOffer(req, res, next)
{
	try
	{
		console.log('saving offer: %j', req.body);

		var json = JSON.parse(req.body);

		var offer = new models.Offer(json);
		
		//offer.index({ location: '2d' });

		var userid = offer.userid;

		internalRemoveOfferByUser(userid);

		console.log('offer for user: ' + userid);

		offer.save(function (err){
			if (err)
			{
				console.log('error: ' + err);
				res.send({ success: false });
			}
			else
			{
				console.log('saved offer');
				res.send({ success: true });
			}

			next();
			return;
		});
	}
	catch(err)
	{
		console.log('caught an error: %s', err);
	}
}

function RemoveOffer(req, res, next)
{
	res.send({ success: internalRemoveOfferByUser(req.body.userid) });
	
	next();
}

function GetOffer(req, res, next)
{
	console.log('attempting to get offer for user: %d', req.params.userid);
	var offer = internalGetOfferByUser(req.params.userid);

	console.log('got return value: %j', offer);
	
	res.send(offer);
	next();
}

function GetNearby(req, res, next)
{
	var longitude = req.body.longitude;
	var latitude = req.body.latitude;

	console.log('attempting to get offer near: "location" : [ /(longitude), /(latitude) ]');
	models.Offer.find({ location : { '$near' : [ longitude, latitude ] } }).exec(function(err, offers) {

		offers.forEach(function(offer) {

			console.log('Found offer: %j', offer);

		});

	});

	console.log('~~done~~');
	next();
}

function SaveProfile(req, res, next)
{
	console.log('SaveProfile called, calling internalSaveProfile');

	console.log('req\n%s', req);

	var guid = uuid.v4();

	console.log('writing file: %s', guid);

	console.log('file: %j', req.files.file);

	//var file = filed('/Users/dsandor/image.jpg');
	//file.write(req.body);
	//file.end();

	console.log('params:\n%s\nparams.userId: %s\nparams.userid: %s', req.params, req.params.userId, req.params.userid);

	filed(req.files.file.path).pipe(filed(profileImageBasePath + 'profileimage_' + req.params.userId + '.png'));

	console.log('done writing file.');
	
	internalSaveProfile();

	res.send("OK");

	next();
}

/********  Internal Functions ***********/

function internalRemoveOfferByUser(userid)
{
	try
	{
		console.log('Removing user (%d) offer.', userid);

		models.Offer.find({ userid: userid }).remove().exec();

		return true;
	}
	catch(err)
	{
		console.log('some stupid error removing offer: %s', err);
		return false;
	}
}

function internalGetOfferByUser(userid)
{
	models.Offer.findOne({ userid: userid }, function (err, offer) {
		if (err) 
		{
			console.log('error getting offer: %s', err);
			return '{ message: ' + err + '}';
		}
		else
		{
			console.log('got offer: %j', offer);
			return offer;
		}
	});
}

function internalSaveProfile()
{
	console.log('internalSaveProfile called.');
}


var server = restify.createServer();
server.use(restify.gzipResponse());
server.use(restify.bodyParser());

server.post('/postoffer/', PostOffer);
server.post('/removeoffer/', RemoveOffer);
server.get('/getoffer/:userid', GetOffer);
server.get('/getnearby/', GetNearby);
server.post('/saveprofile', SaveProfile);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

// http://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2sync_password_salt_iterations_keylen