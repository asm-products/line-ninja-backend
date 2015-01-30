var mongoose = require('mongoose');
var Schema = mongoose.Schema; 

module.exports = function (mongoose)
	{
		var Offer = new Schema(
		{
			location: [Number],
			userid: Number,
			locationDescription: String,
			userDescription: String,
			Price: Number,
			PositionInLine: Number
		});

		var ServiceResponse = new Schema(
		{
			success: Boolean
		});

		var User = new Schema(
			{
				userid: Number,
				firstName: String,
				lastName: String,
				email: String,
				password: String
			}
		);

		var models = {
			Offer: mongoose.model('Offer', Offer),
			ServiceResponse: mongoose.model('ServiceResponse', ServiceResponse)
		};

		return models;
	};
