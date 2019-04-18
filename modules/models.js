var context;

module.exports = function (){	
	if(context){
		return context;
	}

	console.log('Loading models.js')
	
	context = {};
	var mongoose = require('mongoose');
	mongoose.Promise = global.Promise;
	
	//Mongoose
	//Set up MONGOLAB_URI 
	//https://devcenter.heroku.com/articles/mongolab#getting-your-connection-uri	
	mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/anglish', {useNewUrlParser: true});
	console.log('db connecting');

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		//Users scheme _ids are default to all objects
		context.userSchema = mongoose.Schema({
			handle: {type: String, unique: true, required: true, dropDups: true },
			email: {type: String, unique: true, required: true, dropDups: true },
			password: {type: String, required: true},
			permissions: { type: Number, default: 0 },
			createdAt:{ type: Date, default: Date.now },
			updatedAt:{ type: Date, default: Date.now }
		});
		context.userSchema.pre('save', function(next){
			var something = this;
			something.set({updatedAt: Date.now()});
			next();
		});
		context.user = mongoose.model('users', context.userSchema);

		//Words
		context.wordSchema = mongoose.Schema({
			word:{type: String, required: true},
			attested: String,
			unattested: String,
			type: String,
			comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'comments'}],
			createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
			createdAt:{ type: Date, default: Date.now },
			updatedAt:{ type: Date, default: Date.now }
		});
		context.wordSchema.pre('save', function(next){
			var something = this;
			something.set({updatedAt: Date.now()});
			next();
		});
		context.word = mongoose.model('words', context.wordSchema);	

		//Names
		context.nameSchema = mongoose.Schema({
			oe: String,
			ne: String,
			meaning: String,
			extra: String,
			createdAt:{ type: Date, default: Date.now },
			updatedAt:{ type: Date, default: Date.now }
		});
		context.nameSchema.pre('save', function(next){
			var something = this;
			something.set({updatedAt: Date.now()});
			next();
		});
		context.name = mongoose.model('names', context.nameSchema);	

		//Sessions
		context.sessionSchema = mongoose.Schema({
			user:{type: mongoose.Schema.Types.ObjectId, ref: 'users', unique: true, required: true, dropDups: true },
			token:{type: String, unique: true, required: true, dropDups: true },
			createdAt:{ type: Date, default: Date.now },
			updatedAt:{ type: Date, default: Date.now }
		});
		context.sessionSchema.pre('save', function(next){
			var something = this;
			something.set({updatedAt: Date.now()});
			next();
		});
		context.session = mongoose.model('sessions', context.sessionSchema);

		//Comments
		context.commentSchema = mongoose.Schema({
			user:{type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
			word:{type: mongoose.Schema.Types.ObjectId, ref: 'words', required: true},
			comment:{type: String, required: true},
			createdAt:{ type: Date, default: Date.now},
			updatedAt:{ type: Date, default: Date.now}
		});
		context.commentSchema.pre('save', function(next){
				var something = this;
				something.set({updatedAt: Date.now()});
				next();
		});
		context.comment = mongoose.model('comments', context.commentSchema);
	});
		
	//Return our module singleton
	return context;
};