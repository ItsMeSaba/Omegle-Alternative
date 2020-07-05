let express = require('express');
let app = express(); 

let http = require('http').createServer(app);
let io = require('socket.io')(http);

let users = []; //Pending Users Id-s
let paired = {};

setInterval(() => console.log(paired), 5000);

let findPair = valueToFind => {
    let entries = Object.entries(paired);

    if(paired[valueToFind]) {
        return valueToFind;
    }

    for(let [key,value] of entries) {
        if(value == valueToFind) {
            return key;
        }
    }

    return false;
}


io.on('connection', socket => {
    console.log('connected', socket.id);  
    
    let pair = () => {
        if(users.length > 0) {//If There is user waiting connects to eachother 
            let user = users[0]; //gets pending users id
            users.shift(); // deletes pending user from array

            io.to(socket.id).emit('user joined', user); //sends id-s of conencted users
            io.to(user).emit('user joined', socket.id); // to each other

            paired[socket.id] = user;
            console.log(paired);
        } else {//if there is no user w8ing he will be added to array for waiting
            users.push(socket.id);
        }
    }

    let removeUser = (key) => {
        if(key) {
            console.log('disconnected pair:', key, paired[key]);

            // io.to(key).emit('user left');
            // io.to(paired[key]).emit('user left');

            delete paired[key];

        } else {
            for(let i = 0; i < users.length; i++) {
                if(users[i] == socket.id) users.splice(i, 1);
            }
        }
    }

    pair();

    //sending message
    socket.on('send', data => { // on send this recieves id of destination(which was stored on client side variable) and message
        io.to(data.user).emit('send', data.msg); //send message to destination
    })


    socket.on('find new', () => {
        pair();
        console.log('find new', 'id:', socket.id);
    })

    socket.on('user disconnected', data => {
        let key = findPair(data);

        removeUser(key);

        io.to(data).emit('user left')
    })

    //on disconnect
    socket.on('disconnect', () => {

        let key = findPair(socket.id);

        removeUser(key);

        console.log('disconnected', socket.id);
    })
})


app.use((req, res, next) => {
    console.log('IP -->', req.ip);

    next();
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

http.listen(3000, () => console.log('Running Server'))