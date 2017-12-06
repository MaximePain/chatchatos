var express = require('express');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 25567 });

var app = express();

console.log('YOP!');

app.get('/', function(req, res){
	//res.setHeader('Content-Type', 'text/plain');
	res.render('chat.ejs', 0);
});

wss.on('connection', function connection(ws){
	console.log("WOW CONNECTION");
	ws.on('message', function(msg){
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
	});
});

app.listen(25565);

