let express = require('express');
let app = express(); 


let http = require('http').createServer(app);
let io = require('socket.io')(http);

let users = []; // Pending Users Id-s
let paired = {}; // Already Paired Users 


let findPair = valueToFind => {
          
    if(paired.hasOwnProperty(valueToFind)) return valueToFind

    let entries = Object.entries(paired);

    for(let [key,value] of entries) {
        if(value == valueToFind) return key;
    }

    return false;
}


io.on('connection', socket => {
    
    let pair = () => {
        if(users.length > 0) { // Checks if anyone is waiting for pair
            let user = users[0]; // gets first pending users id
            users.shift(); // deletes pending user from array

            // Exchanges User ID-s with eachother
            io.to(socket.id).emit('user joined', user);
            io.to(user).emit('user joined', socket.id); 


            paired[socket.id] = user; // Adds Users to paird list

            console.log(paired)
        } else { //if there is no user to pait with current user gets added to waitinig list
            users.push(socket.id);
        }
    }

    // Handling removal of user
    let removeUser = key => {
        if(key) {

            // io.to(key).emit('user left');
            // io.to(paired[key]).emit('user left');

            delete paired[key];

        } else {
            for(let i = 0; i < users.length; i++) {
                if(users[i] == socket.id) users.splice(i, 1);
            }
        }
    }

    pair(); // Try pairing newly joined user 

    // Sending message
    socket.on('send', data => { // on send this recieves id of destination(which was stored on client side variable) and message
        io.to(data.user).emit('send', data.msg); //send message to destination
    })

    // Pairing user
    socket.on('find new', () => {
        pair();
    })

    // User manual disconnect
    socket.on('user disconnected', data => {
        let key = findPair(data);

        removeUser(key);

        io.to(data).emit('user left')
    })

    // Unexpected disconnect
    socket.on('disconnect', () => {
        let key = findPair(socket.id);

        removeUser(key);
    })
})


app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

http.listen(3000, () => console.log('Running Server'))