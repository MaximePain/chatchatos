var express = require('express');
var app = express();
console.log('YOP!');

app.get('/', function(req, res){
	//res.setHeader('Content-Type', 'text/plain');
	res.render('hello.ejs', 0);
});

app.listen(25565);

