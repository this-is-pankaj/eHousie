'use strict';
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const admin = 'panks@8013545945.ph';
let count =1;
let numbersPicked = [];
let users = [];
app.use(express.static(`${__dirname}/public`));

io.on('connection', function(socket){
  if(numbersPicked.length){
    io.emit('ongoingGame', {numbersPicked,online: count, lastPicked: numbersPicked[numbersPicked.length-1]});
  }
  
  socket.on('userJoined', function(userinfo){
    users.push(userinfo);
    console.log(`${userinfo.username} Joined`);
    socket.broadcast.emit('userJoined', {users, newUser: userinfo});
  })

  socket.on('numberPicked', function(msg){
    console.log('Number Picked: ' + msg);
    numbersPicked.push(msg);
    io.emit('newNumber', {newNum: msg, numbersPicked,online: count});
  });

  socket.on('resetGame', function(msg){
    numbersPicked=[];
    io.emit('ongoingGame', {numbersPicked,online: count});
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});