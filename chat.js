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


var salle = {
};

wss.on('connection', function connection(ws){
    var ok = {
        msg: 'OK',
        type: 'ok'
    }
    ws.send(JSON.stringify(ok));
    
    console.log("connexion!");
    
	ws.on('message', function(msg){
        var date = new Date();
        var data = JSON.parse(msg);
        data.minutes = date.getMinutes();
        data.heures = date.getHours() + 1;
        
        if(data.connect == 'first')
        {
            ws.pseudo = data.pseudo
            var msgConnexion = {
                msg: "Bienvenue sur le Chat " + ws.pseudo + "!",
                pseudo: "SERVEUR",
                type: 'chatMsg',
                minutes: date.getMinutes(),
                heures: date.getHours() + 1
            }
            ws.room = data.room;
            if(salle[ws.room] === undefined)
                salle[ws.room] = {msg: []};
            salle[ws.room].msg.forEach(function(dataMsg){
                ws.send(JSON.stringify(dataMsg));
            });
            ws.send(JSON.stringify(msgConnexion));
            
            if(ws.pseudo == "SERVEUR")
                ws.pseudo = "[un con qui essait de se faire passer pour le serveur en changeant son pseudo]";
            if(ws.pseudo == "ADMIN")
                ws.pseudo = "[un con qui essait de se faire passer pour un admin en     changeant son pseudo]";
            if(ws.pseudo == "admin:password:serveur")
                ws.pseudo = "SERVEUR";
            if(ws.pseudo == "admin:password:admin")
                ws.pseudo = "ADMIN";
        }
        else{
                    if(salle[ws.room].msg.length > 50)
            salle[ws.room].msg.shift();
        salle[ws.room].msg.push(data);
        }
        data.pseudo = ws.pseudo;
        
        if(data.type == "chatMsg" || data.connect == 'first' || data.type == 'disconnect')
            wss.clients.forEach(function each(client) {
                if (client !== ws 
                    && client.readyState === WebSocket.OPEN 
                    && client.room == ws.room
                   ) 
                {
                    if(data.connect == 'first')
                        {
                            msgConnexion.msg = "Bienvenue à " + ws.pseudo + " qui vient de se connecter!";
                            client.send(JSON.stringify(msgConnexion));
                        }
                    else if(data.connect == 'chatMsg')
                        client.send(JSON.stringify(data));
                    else if(data.connect == 'disconnect')
                        {
                            var msg = {
                msg: ws.pseudo + " vient de se déconnecter!",
                pseudo: "SERVEUR",
                type: 'chatMsg',
                minutes: date.getMinutes(),
                heures: date.getHours() + 1
            }
                            client.send(JSON.stringify(msg));
                        }
                }
            });
        ws.on('disconnect', function(){
            console.log(ws.pseudo + "vient de se deconnecter!");
            var msg = {
                msg: ws.pseudo + " vient de se déconnecter!",
                pseudo: "SERVEUR",
                type: 'chatMsg',
                minutes: date.getMinutes(),
                heures: date.getHours() + 1
            }
            wss.clients.forEach(function each(client){
                if(client !== ws
                    && client.readyState === WebSocket.OPEN
                    && client.room == ws.room
                  )
                    {

                        client.send(JSON.stringify(msg));
                    }
            });
        });
	});
});

//app.listen(PORT);

server.listen(PORT, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

