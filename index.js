'use strict';
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ticket = require('./server/generateTicket');
const admin = 'panks@8013545945.ph';
let numbersPicked = [];
let users = {};
app.use(express.static(`${__dirname}/public`));

function generateUserNameList() {
  let list = [];
  for(let i in users) {
    let info ={
      username: users[i].username
    }
    list.push(info);
  }
  return list;
}

io.on('connection', function(socket){
  // if(users.length){
    io.emit('ongoingGame', {
      numbersPicked,
      users: generateUserNameList(),
      lastPicked: numbersPicked[numbersPicked.length-1]
    });
  // }
  
  socket.on('userJoined', async function(userinfo){
    userinfo.isActive = true;
    console.log(`All users ${JSON.stringify(users)}`);
    if(users[userinfo.phone]) {
      if(userinfo.email===admin) {
        userinfo.role='admin';
      }
      users[userinfo.phone] = userinfo;
      socket.user = userinfo;
      console.log(`${userinfo.username} Joined`);
      socket.broadcast.emit('userReJoined', {
        users: generateUserNameList(), 
        newUser: userinfo.username
      });
    }
    else {
      console.log(`Else encounntered`);
      let ticketNumbers = await ticket.generateRandomTicket()
          .catch((err)=>{
            console.log(err);
            return [];
          })
      if(userinfo.email===admin) {
        userinfo.role='admin';
      }
      else {
        userinfo.ticket = ticketNumbers;
      }
      users[userinfo.phone] = userinfo;
      socket.user = userinfo;
      console.log(`${userinfo.username} Joined`);
      socket.emit('your ticket', {
        ticket: ticketNumbers,
        users: generateUserNameList()
      });
      socket.broadcast.emit('userJoined', {
        users: generateUserNameList(), 
        newUser: userinfo.username,
      });
    } 
  })

  socket.on('numberPicked', function(msg){
    console.log('Number Picked: ' + msg);
    numbersPicked.push(msg);
    io.emit('newNumber', {
      newNum: msg, 
      numbersPicked
    });
  });

  socket.on('resetGame', function(msg){
    numbersPicked=[];
    io.emit('ongoingGame', {
      numbersPicked,
      users: generateUserNameList()
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    try{
      console.log(`${socket.user.username} left`);
      users[socket.user.phone].isActive = false;
      // echo globally that this client has left
      socket.broadcast.emit('userLeft', {
        users: generateUserNameList(),
        userLeft: socket.user.username
      });
    }
    catch(exc){

    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});