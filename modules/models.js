var context;

module.exports = function (){
	console.log('Loading models.js')
	
	if(context){
		return context;
	}
	
	context = {};
	var mongoose = require('mongoose');
	mongoose.Promise = global.Promise;
	
	//Mongoose
	//Set up MONGOLAB_URI 
	//https://devcenter.heroku.com/articles/mongolab#getting-your-connection-uri	
	mongoose.connect(process.env.MONGODB_URI);
	console.log('db connecting');

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {

		//Users scheme
		context.userSchema = mongoose.Schema({
			handle: {type: String, unique: true, required: true, dropDups: true },
			email: {type: String, unique: true, required: true, dropDups: true },
			password: {type: String, required: true},
			permissions: { type: Number, default: 0 }
		});
		context.user = mongoose.model('users', context.userSchema);

		//Words
		context.wordSchema = mongoose.Schema({
			word:{type: String, required: true},
			attested: String,
			unattested: String,
			type: String
		});
		context.word = mongoose.model('words', context.wordSchema);	

		//Names
		context.nameSchema = mongoose.Schema({
			oe: String,
			ne: String,
			meaning: String,
			extra: String
		});
		context.name = mongoose.model('names', context.nameSchema);	

		//Sessions
		context.sessionSchema = mongoose.Schema({
			user:{type: mongoose.Schema.Types.ObjectId, ref: 'users', unique: true, required: true, dropDups: true },
			token:{type: String, unique: true, required: true, dropDups: true },
			dateCreated: { type: Date, default: Date.now }
		});
		context.session = mongoose.model('sessions', context.sessionSchema);
	});
		
	//Return our module singleton
	return context;
};