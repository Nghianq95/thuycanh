var express = require('express');
var app = express();
var port = process.env.PORT || 8321;

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://quangnghia:1234567890@ds227459.mlab.com:27459/thuycanhdb";

var status = false;
var stage2;
var stage3;
var stage4;
var stage5;

app.use(express.static('public'));
app.set("view engine", "ejs");
app.set("views", "./views");

var server = require("http").Server(app);
var io = require("socket.io")(server);

server.listen(port, function(){
	console.log("Server is listening on PORT: ", port);
});

io.on("connection", function(socket){
	console.log('a user is connected');
	
	socket.on('user send setData', (data)=>{
		updateData(data);
		 /*stage2 = setTimeout(stageChange, 7*24*60*60*1000, 2.8, 2, "OK");
		 stage3 = setTimeout(stageChange, 14*24*60*60*1000,3.0, 3, "OK");
		 stage4 = setTimeout(stageChange, 21*24*60*60*1000, 2.5, 4, "OK");
		 stage5 = setTimeout(stageChange, 28*24*60*60*1000, 2.5, 1, "not OK");*/
	});
	socket.on('user send stop', (data)=>{
		updateData(data);
		clearTimeout(stage2);
		clearTimeout(stage3);
		clearTimeout(stage4);
		clearTimeout(stage5);

	});

	sendSetData();
	sendChart();

	socket.on('client send data', (data)=>{
		io.sockets.emit('Server send data', data);
		MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var dbo = db.db("thuycanhdb");
		  dbo.collection("setValue").findOne({}, function(err, result) {
		    if (err) throw err;
		    status = result.status;
		    db.close();
		  });
		});
		if(status === "true"){
			setInterval(()=>{
				MongoClient.connect(url, (err, db)=>{
					if (err) throw err;
					var dbo = db.db("thuycanhdb");
					dbo.collection("statusSystem").insertOne(data, (err, res)=>{
						if(err) throw err;
						console.log("inisert info System!");
						db.close();
					});
				});
			}, 30*60*1000);
		};
	});

	socket.on('client send status', (data)=>{
		io.sockets.emit("Server send status", data);
	});
});


app.get('/', function(req, res){
	res.render("trangchu");
});
app.get('/dieukhien', function(req, res){
	res.render("dieukhien");
});
app.get('/sanpham', function(req, res){
	res.render("sanpham");
});
app.get('/dothi', (req, res)=>{
	res.render("dothi");
});

function updateData(data){
	io.sockets.emit("server send raspi", data);
	MongoClient.connect(url, (err, db)=>{
		if (err) throw err;
		var dbo = db.db("thuycanhdb");
		var myquery = { id: 1 };
		var newvalues = { $set: {
			id: data.id,
			setEC: data.setEC,
			setpH: data.setpH,
			setGiaiDoan: data.setGiaiDoan,
			setLoaiCay: data.setLoaiCay,
			setStartDay: data.setStartDay,
			status: data.status
			} 
		};
		dbo.collection("setValue").updateOne(myquery, newvalues, function(err, res) {
		    if (err) throw err;
		    console.log("1 document updated");
		    db.close();
		});
	});
	io.sockets.emit('Server send setData', data);
};

function stageChange(EC, stage, state){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("thuycanhdb");
	  dbo.collection("setValue").findOne({}, function(err, result) {
	    if (err) throw err;
	    result.setEC = EC;
		result.setGiaiDoan = stage;
		result.status = state;
		updateData(result);
	    db.close();
	  });
	});
};

function sendSetData(){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("thuycanhdb");
	  dbo.collection("setValue").findOne({}, function(err, result) {
	    if (err) throw err;
	    io.sockets.emit('Server send setData', result);
	    db.close();
	  });
	});
};

function sendChart(){
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var EC=[];
	  var dbo = db.db("thuycanhdb");
	  dbo.collection("statusSystem").find({}).toArray(function(err, result) {
	    if (err) throw err;
	   		io.sockets.emit("server send statusSystem", result);
	   		db.close();
	    }); 
	  });
};