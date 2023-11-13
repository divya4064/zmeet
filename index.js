const express = require('express');
const app = express();

const socket=require('socket.io');

const server=app.listen(3000, () => {
    console.log(" Server is running on port 3000 ");
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.static('views'));

const userRoutes =require('./routes/userRoute');
app.use('/', userRoutes);

const io=socket(server);

//socket  io work

var userConnection = [];

io.on("connection", (socket) => {
    socket.on("users_info_to_signaling_server", (data) => {
        var other_users=userConnection.filter(p => p.meeting_id == data.meeting_id);
        userConnection.push({
            connectionId: socket.id,
            user_id: data.current_user_name,
            meeting_id:data.meeting_id
        });

        //console.log("user_connection",userConnection,);
        // console.log(`other users ${userConnection.map(a => a.connectionId)}`);
        // console.log(`other users ${other_users.map(a => a.connectionId)}`);

        other_users.forEach(v => {
            socket.to(v.connectionId).emit('other_users_to_inform' ,{
                other_user_id: data.current_user_name,
               // other_user_id: data.meeting_id,
                connId:socket.id
            })
        })
        socket.emit("newConnectionInformation", other_users);

          
    })
    socket.on('sdpProcess' ,(data) =>{
        socket.to(data.to_connid).emit('sdpProcess' ,{
            message:data.message,
            from_connid:socket.id
        })

    })
    socket.on('disconnect', function(){
       var disUser= userConnection.find(p => p.connectionId == socket.id);
       if(disUser){
        var meeting_id=disUser.meeting_id;
        userConnection=userConnection.filter(p => p.connectionId != socket.id);
        var other_users=userConnection.filter(p => p.meeting_id == meeting_id);
        other_users.forEach(v => {
            socket.to(v.connectionId).emit('closedConnectionInfo' ,{
                connId:socket.id
            })
        })
       }
    })

});

