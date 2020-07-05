(() => {
    
    let socket = io();
    let user = false;

    let messageAppender = (data, cssClass) => {
        let p = document.createElement('p');
        
        p.innerHTML = data;

        cssClass ? p.className = cssClass : null; 

        document.getElementsByClassName('messages')[0].appendChild(p);
    }

    let clearMessages = () => {
        let messages = document.getElementsByClassName('messages')[0];

        while(messages.firstChild) {
            messages.removeChild(messages.firstChild)
        }
    }

    let send = (msg) => {
        if(msg.trim().length == 0) return false;

        socket.emit('send', {msg : msg, user : user})
        
        messageAppender(msg, 'mine');
    }

    let eventListeners = () => {
        document.getElementById('input').addEventListener('keypress', (e) => {
            let input = document.getElementById('input');
            if(e.code == 'Enter') {
                send(input.value);
                input.value = '';
            }
        });

        document.getElementById('send').addEventListener('click', () => {
            let input = document.getElementById('input');
            send(input.value);
            input.value = '';
        });

        document.getElementById('next').addEventListener('click', () => {
            let messages = document.getElementsByClassName('messages')[0];

            if(user) socket.emit('user disconnected', user);
            
            socket.emit('find new');

            clearMessages();

            messageAppender('Searching...')
        });
    }

    eventListeners();

    let disableInput = (disabled = true) => {
        document.getElementById('send').disabled = disabled;
        document.getElementById('input').disabled = disabled;
    }

    let socketHandlers = () => {
        socket.on('user joined', data => {
            user = data;
        
            clearMessages();

            messageAppender('Connected');
            
            disableInput(false);

        })
        
        socket.on('send', data => {
            messageAppender(data, 'guests');
        })
        
        socket.on('user left', () => {
            user = false;

            messageAppender('User Disconnected');

            disableInput();
        })
    }

    socketHandlers();
})();






