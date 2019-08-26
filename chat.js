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
.get('/:idRoom', function(req, res){
    res.render('chat.ejs');
});

app.use(express.static(__dirname + '/public'));


var salle = {
};

var personne = [{}];

/*personne[0] = {
    id: '0',
    room: ''
};*/

var nbClients = 0;

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
            console.log('first');
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
                salle[ws.room] = {msg: [], pseudoLs: []};
            salle[ws.room].msg.forEach(function(dataMsg){
                ws.send(JSON.stringify(dataMsg));
            });
            ws.send(JSON.stringify(msgConnexion));
            
            if(ws.pseudo == "SERVEUR")
                ws.pseudo = "[un idiot qui essait de se faire passer pour le serveur en changeant son pseudo]";
            if(ws.pseudo == "ADMIN")
                ws.pseudo = "[un idiot qui essait de se faire passer pour un admin en changeant son pseudo]";
            if(ws.pseudo == "admin:password:serveur")
                ws.pseudo = "SERVEUR";
            if(ws.pseudo == "admin:password:admin")
                ws.pseudo = "ADMIN";
            
            salle[ws.room].pseudoLs.push(ws.pseudo);
        }
        else if(data.type != 'getStats' && data.type != 'pseudo?' && data.type != 'ping' && data.type != 'connect' && data.type != 'askPseudo'){
            if(salle[ws.room].msg.length > 1000)
                salle[ws.room].msg.shift();
            salle[ws.room].msg.push(data);
        }
        else if(data.type == 'pseudo?')
                        {
                            ws.room = data.room;
                            if(salle[ws.room] !== undefined)
                                console.log(salle[ws.room].pseudoLs);
                            let valPseudoExist = false;
                            if(salle[ws.room] !== undefined)
                            salle[ws.room].pseudoLs.forEach(function each(pseudoTemp){
                                if(data.pseudo == pseudoTemp)
                                    valPseudoExist = true;
                            });
                            let result = 'nope';
                            if(!valPseudoExist && data.pseudo != '' && data.pseudo != ' ')
                                result = 'okay';
                            console.log('result: ', result);
                            let msg = {
                                type: 'pseudo?',
                                result: result
                            };
                            ws.send(JSON.stringify(msg));
                        }
        if(data.type == "connect")
        {
            let id = generateId();
            let msg = {
                type: 'connect',
                id: id
            }
            personne.push({
                id: id,
                room: data.room,
                pseudo: data.pseudo
            });

            ws.send(JSON.stringify(msg));
        }
        else if(data.type == "askPseudo")
        {
            let msg = {
                type: 'askPseudo',
                pseudo: getPersonneById(data.id).pseudo
            }
            ws.send(JSON.stringify(msg));
        }
        
        data.pseudo = ws.pseudo;
        
                    
        
        
        if(data.type == "chatMsg" || data.connect == 'first' || data.type == 'disconnect' || data.type == 'ping')
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
                    else if(data.type == 'chatMsg'){
                        //data.pseudo = getPersonneById()
                        client.send(JSON.stringify(data));
                    }
                    else if(data.type == 'disconnect')
                        {
                            
                            var msg = {
                                msg: ws.pseudo + " vient de se déconnecter!",
                                pseudo: "SERVEUR",
                                type: 'chatMsg',
                                minutes: date.getMinutes(),
                                heures: date.getHours() + 1
                            }
                            client.send(JSON.stringify(msg));
                            for(var i = 0; i < salle[ws.room].pseudoLs.length; i++)
                                    if(data.pseudo == salle[ws.room].pseudoLs[i])
                                        salle[ws.room].pseudoLs[i] = '';
                        }
                    else if(data.type == 'ping')
                        {
                            nbClients++;
                        }
                }
            });
        if(data.type == "ping")
        {
            var ping = {
                type: 'pong',
                msg: 'nbClients :) : ',
                nbClients: nbClients + 1,
                msg2: '-_-'
            }
            ws.send(JSON.stringify(ping));
            nbClients = 0;
            //getPersonneById(data.id).ping = 0;
        }
        if(data.type == 'getStats'){
            console.log("getStats!");
            var stats = {};
            wss.clients.forEach(function each(client) {
                if (client.room !== undefined)
                    {
                        if(stats[client.room] === undefined)
                            stats[client.room] = 1;
                        else
                            stats[client.room]++;
                    }
            });
            var statMsg = {
                type: 'getStats',
                stats: JSON.stringify(stats)
            }
            ws.send(JSON.stringify(statMsg));
        }
        
        
        /*ws.on('disconnect', function(){
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
        });*/
	});
});

function generateId()
{
    return Math.floor(Math.random() * 1000000);
}

function getPersonneById(id){
    for(let i = 0; i < personne.length; i++)
    {
        if(personne[i].id == id)
            return personne[i];
    }
    return 0;
}

/*setInterval(function(){
    for(let i = 0; i < personne.length; i++){
        if(personne[i] !== undefined)
        if(personne[i].ping !== undefined){
            personne[i].ping++;
            if(personne[i].ping > 4)
            {
                if(personne[i].room !== undefined)
                    for(let y = 0; y < salle[personne[i].room].pseudoLs.length; i++)
                        if(personne[i].pseudo == salle[personne[i].room].pseudoLs[i])
                            salle[personne[i].room].pseudoLs[i] = '';
                personne[i] = {};
            }
        }
        else
            personne[i].ping = 0;
    }
}, 2000);*/

//app.listen(PORT);

server.listen(PORT, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

