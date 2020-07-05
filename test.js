let express = require('express');
let app = express(); 

let http = require('http').createServer(app);
let io = require('socket.io')(http);

let users = []; //Pending Users Id-s

setInterval(() => console.log('users', users), 5000);

io.on('connection', socket => {
    console.log('connected', socket.id);  
    
    let pair = () => {
        if(users.length > 0) {//If There is user waiting connects to eachother 
            let user = users[0]; //gets pending users id
            users.shift(); // deletes pending user from array

            io.to(socket.id).emit('user joined', user); //sends id-s of conencted users
            io.to(user).emit('user joined', socket.id); // to each other

        } else {//if there is no user w8ing he will be added to array for waiting
            users.push(socket.id);
        }
    }

    let removeUser = (id) => {
        let pos = users.indexOf(id);

        if(pos != -1) {
            users.splice(pos, 1);
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
        // let key = findPair(data);

        removeUser(data);

        io.to(data).emit('user left');
    })

    //on disconnect
    socket.on('disconnect', () => {

        // let key = findPair(socket.id);

        removeUser(socket.id);

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