var express = require('express');
var http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 5000

var app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

console.log('YOP!');

app.get('/', function(req, res){
	//res.setHeader('Content-Type', 'text/plain');
	res.render('hello.ejs');
})
.get('/:ibRoom', function(req, res){
    res.render('chat.ejs');
});

wss.on('connection', function connection(ws){
    var ok = {
        msg: 'OK',
        type: 'ok'
    }
    ws.first = false;
    ws.send(JSON.stringify(ok));
    
    console.log("connexion!");
	ws.on('message', function(msg){
        var data = JSON.parse(msg);
        if(data.pseudo == "SERVEUR")
            data.pseudo = "[le con qui essait de se faire passer pour le serveur]";
        
        if(data.connect !== undefined && data.connect == 'first')
        {
            ws.first = true;
            var msgConnexion = {
                msg: "Bienvenue sur le Chat " + data.pseudo + "!",
                pseudo: "SERVEUR",
                type: 'chatMsg'
            }
            ws.room = data.room;
            ws.send(JSON.stringify(msgConnexion));
        }
        if(data.type == "chatMsg" || ws.first == true)
            wss.clients.forEach(function each(client) {
                if (client !== ws 
                    && client.readyState === WebSocket.OPEN 
                    && client.room == ws.room
                   ) 
                {
                    if(ws.first == true)
                        {
                            ws.first = false;
                            msg.msg = "Bienvenue à " + data.pseudo + " qui vient de se connecter!";
                        }
                    client.send(msg);
                }
            });
	});
});

//app.listen(PORT);

server.listen(PORT, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

