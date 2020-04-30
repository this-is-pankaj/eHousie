'use strict';
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ticket = require('./server/generateTicket');
const admin = {
  email: process.env.admin || 'admin',
  id: ''
};
const prizes = require('./server/config/prizes.constant');
let numbersPicked = [];
let users = {};
app.use(express.static(`${__dirname}/public`));
let kickedUsers = [];
let gameId = Date.now();

function generateUserNameList() {
  let list = [];
  for(let i in users) {
    // return only the name of active users
    if(users[i].isActive) {
      let info ={
        username: users[i].username
      }
      list.push(info);
    }
  }
  return list;
}

function getActivePrizes()  {
  let list =  [];
  for(let type in prizes) {
    if(prizes[type].isActive){
      list.push({
        type,
        text:prizes[type].displayText,
        amount: prizes[type].amount
      });
    }
  }
  return list;
}

function winnerStats() {
  return new Promise((resolve, reject)=>{
    try {
      let winners = [];
      for(let type in prizes) {
        let prize = prizes[type];
        let info = {};
        if(!prize.isActive) {
          info.text = prize.displayText;
          let winner = prize.claimedBy.filter((obj)=>{
            if(obj.isClaimValid) {
              return obj;
            }
          });
          if(winner && winner.length) {
            info.winner = winner[0].user.username;
            winners.push(info);
          }
        }
      }
      resolve(winners);
    }
    catch(exc) {
      console.log(`Exception handled for generating prize: ${exc}`);
      reject(exc);
    }
  })
}

io.on('connection', function(socket){
  // if(users.length){
    io.emit('ongoingGame', {
      numbersPicked,
      users: generateUserNameList(),
      lastPicked: numbersPicked[numbersPicked.length-1],
      gameId
    });
  // }
  
  socket.on('userJoined', async function(userinfo){
    userinfo.isActive = true;
    try{
      if(kickedUsers.indexOf(userinfo.phone)>-1) {
        socket.disconnect();
      }
    }
    catch(exc){
      console.log(`Exception when validating user kicked ${exc}`)
    }
    // Check if user is admin
    if(userinfo.email===admin.email) {
      userinfo.role='admin';
      admin.id = socket.id;
    }

    console.log(`All users ${JSON.stringify(users)}`);
    if(users[userinfo.phone]) {
      let ticketNumbers = users[userinfo.phone].ticket;
      userinfo.ticket = ticketNumbers;
      userinfo.id= socket.id;
      users[userinfo.phone] = userinfo;
      socket.user = userinfo;
      
      console.log(`${userinfo.username} Joined as a ${userinfo.role} and ticket details: ${JSON.stringify(ticketNumbers)}`);
      socket.emit('your ticket', {
        ticket: ticketNumbers,
        users: generateUserNameList(),
        gameId
      });
      io.emit('userJoined', {
        users: generateUserNameList(), 
        newUser: userinfo.username,
        role: userinfo.role,
        numbersPicked,
        gameId
      });
    }
    else {
      let ticketNumbers = await ticket.generateRandomTicket()
          .catch((err)=>{
            console.log(err);
            return [];
          })
      if(userinfo.email===admin.email) {
        userinfo.role='admin';
        userinfo.ticket = ticketNumbers;
      }
      else {
        userinfo.ticket = ticketNumbers;
      }
      userinfo.id= socket.id;
      users[userinfo.phone] = userinfo;
      socket.user = userinfo;
      console.log(`${userinfo.username} Joined and ticket details: ${JSON.stringify(ticketNumbers)}`);
      socket.emit('your ticket', {
        ticket: ticketNumbers,
        users: generateUserNameList(),
        gameId
      });
      io.emit('userJoined', {
        users: generateUserNameList(), 
        newUser: userinfo.username,
        role: userinfo.role,
        numbersPicked,
        gameId
      });
    } 
    socket.emit('generatePrize', {
      gameId,
      prizeList: getActivePrizes(),
      numbersPicked
    })
  })

  socket.on('numberPicked', function(msg){
    console.log(`Number Picked: ${msg} by ${socket.user.username}`);
    if(socket.user.email === admin.email || socket.id === admin.id) {
      numbersPicked.push(msg);
      io.emit('newNumber', {
        newNum: msg, 
        numbersPicked,
        gameId
      });
    }
    else {
      try{
        socket.emit('boogie', {spoiler: true, gameId});
        kickedUsers.push(socket.user.phone);
      }
      catch(exc){
        console.log(`Exception when kicking user ouit: ${exc}`)
      }
    }
  });

  socket.on('resetGame', function(msg){
    console.log(`Board Reset by ${socket.user.username}`);
    if(socket.user.email === admin.email || socket.id === admin.id) {
      numbersPicked=[];
      gameId = Date.now();
      io.emit('ongoingGame', {
        numbersPicked,
        users: generateUserNameList(),
        gameId
      });
    }
    else {
      try{
        socket.emit('boogie', {spoiler: true, gameId});
        kickedUsers.push(socket.user.phone);
      }
      catch(exc){
        console.log(`Exception when kicking user ouit: ${exc}`)
      }
    }
  });

  socket.on('claimPrize', (info)=>{
    try{
      // Check if the user is not boogied
      if(!users[socket.user.phone].isBoogie){
        //  if a user  is active, allow claim, else ask him to reload
        if(users[socket.user.phone].isActive) {
          let claimList = prizes[info.type].claimedBy;
          if(prizes[info.type].isActive) {
            console.log(`prize claimed by ${socket.user.username}`)
            if(socket.user){
              prizes[info.type].isActive = false;
              prizes[info.type].claimedBy.push({user: socket.user , id: socket.id});
              // Inform all users about the claim
              io.emit('prizeClaim', {
                prize: {
                  type: info.type,
                  text: prizes[info.type].displayText
                },
                claimedBy: socket.user.username,
                gameId
              });

              io.to(admin.id).emit('reviewClaim', {
                prize: {
                  type: info.type,
                  text: prizes[info.type].displayText
                },
                ticket: users[socket.user.phone].ticket,
                claimedBy: {
                  id: socket.user.phone,
                  username: socket.user.username
                },
                gameId
              })
            }
          }
          else {
            socket.emit('alreadyClaimed', {
              prize: {
                type: info.type,
                text: prizes[info.type].displayText
              },
              claimedBy: 'Someone',
              gameId
            });
            // prizes[info.type].claimedBy.push({user: socket.user , id: socket.id});
          }
        }
        else{
          socket.emit('youLeft', {gameId});
        }
      }
      else{
        socket.emit('boogie', {
          gameId
        });
      }
    }
    catch(exc) {

    }
  });

  socket.on('validation', (report)=>{
    console.log(`Validation Result by ${socket.user.username}`);
    if(socket.user.email === admin.email || socket.id === admin.id) {

      console.log(`Validation Report ${JSON.stringify(report)}`);
      let userInfo = users[report.id] || {};   //Socket Id of the claimee
      let prizeClaimed = report.prizeType;

      console.log(`User Detected ${JSON.stringify(userInfo)}`);
      // If a user was not boogied, push the prize.
      // Else activate the prize again
      if(!userInfo.isBoogie) {
        let user = prizes[prizeClaimed].claimedBy.filter((user)=>{
          if(userInfo.id === user.id){
            user.isClaimValid = report.isClaimValid;
            return user;
          }
        });

        console.log(`User ID Verified ${JSON.stringify(user)}`);
        // If the user is inn the array, inform others on the valiidation result
        // Else open the prize for others.
        if(user && user.length) {
          // boogie the user if the claim is wrong
          if(!report.isClaimValid) {
            userInfo.isBoogie = true;
            prizes[prizeClaimed].isActive = true;
          }
          else{
            prizes[prizeClaimed].isActive = false;
          }
          io.emit('claimReviewed', {
            isClaimValid: report.isClaimValid,
            prize: {
              type: prizeClaimed,
              text: prizes[prizeClaimed].displayText
            },
            claimedBy: userInfo.username,
            gameId
          })

          io.emit('generatePrize', {
            gameId,
            prizeList: getActivePrizes(),
            numbersPicked
          })
          
          // Send info to the claimee about his claim.
          // io.to(user.id).emit('yourClaimResult', {
            
          // })
        }
        else{
          io.emit('claimReviewed', {
            isClaimValid: false,
            prize: {
              type: prizeClaimed,
              text: prizes[prizeClaimed].displayText
            },
            claimedBy: userInfo.username,
            gameId
          })
        }
      }
      else{
        prizes[prizeClaimed].isActive = true;
      }
      console.log(`Prize status ${JSON.stringify(prizes[prizeClaimed])}`);
    }
    else{
      try{
        socket.emit('boogie', {spoiler: true, gameId});
        kickedUsers.push(socket.user.phone);
      }
      catch(exc){
        console.log(`Exception when kicking user ouit: ${exc}`)
      }
    }
  });

  socket.on('gameOver', async ()=>{
    console.log(`Game Over. Results Declared by ${socket.user.username}`);
    if(socket.user.email === admin.email || socket.id === admin.id){
      // Show the users the screen with winners name and prizes
      let winners = await winnerStats()
        .catch((err)=>{
          return [];
        })
      io.emit('gameOver', {winners, gameId});
    }
    else{
      try{
        socket.emit('boogie', {spoiler: true, gameId});
        kickedUsers.push(socket.user.phone);
      }
      catch(exc){
        console.log(`Exception when kicking user ouit: ${exc}`)
      }
    }
  })

  socket.on('continueGame', ()=>{
    io.emit('continueGame', {gameId});
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', (reason) => {
    try{
      console.log(`${socket.user.username} left because of ${reason}`);
      users[socket.user.phone].isActive = false;
      // echo globally that this client has left
      socket.broadcast.emit('userLeft', {
        users: generateUserNameList(),
        userLeft: socket.user.username,
        gameId
      });
      socket.emit('youLeft', {gameId});
    }
    catch(exc){

    }
  });
});

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});