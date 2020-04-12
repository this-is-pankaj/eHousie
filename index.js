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
          })
          info.winner = winner[0].user.username;
          winners.push(info);
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
      lastPicked: numbersPicked[numbersPicked.length-1]
    });
  // }
  
  socket.on('userJoined', async function(userinfo){
    userinfo.isActive = true;
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
      
      console.log(`${userinfo.username} Joined`);
      socket.emit('your ticket', {
        ticket: ticketNumbers,
        users: generateUserNameList()
      });
      io.emit('userJoined', {
        users: generateUserNameList(), 
        newUser: userinfo.username,
        role: userinfo.role
      });
    }
    else {
      console.log(`Else encounntered`);
      let ticketNumbers = await ticket.generateRandomTicket()
          .catch((err)=>{
            console.log(err);
            return [];
          })
      if(userinfo.email===admin.email) {
        userinfo.role='admin';
      }
      else {
        userinfo.ticket = ticketNumbers;
      }
      userinfo.id= socket.id;
      users[userinfo.phone] = userinfo;
      socket.user = userinfo;
      console.log(`${userinfo.username} Joined`);
      socket.emit('your ticket', {
        ticket: ticketNumbers,
        users: generateUserNameList()
      });
      io.emit('userJoined', {
        users: generateUserNameList(), 
        newUser: userinfo.username,
        role: userinfo.role
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

  socket.on('claimPrize', (info)=>{
    try{
      // Check if the user is not boogied
      if(!users[socket.user.phone].isBoogie){
        let claimList = prizes[info.type].claimedBy;
        if(prizes[info.type].isActive) {
          if(socket.user){
            prizes[info.type].isActive = false;
            prizes[info.type].claimedBy.push({user: socket.user , id: socket.id});
            // Inform all users about the claim
            io.emit('prizeClaim', {
              prize: {
                type: info.type,
                text: prizes[info.type].displayText
              },
              claimedBy: socket.user.username
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
              }
            })
          }
        }
        else {
          prizes[info.type].claimedBy.push({user: socket.user , id: socket.id});
          socket.emit('alreadyClaimed', {
            prize: {
              type: info.type,
              text: prizes[info.type].displayText
            },
            claimedBy: claimList[claimList.length-1].user.username
          }) 
        }
      }
      else{
        socket.emit('boogie');
      }
    }
    catch(exc) {

    }
  });

  socket.on('validation', (report)=>{
    console.log(`Validation Report ${JSON.stringify(report)}`);
    let userInfo = users[report.id] || {};   //Socket Id of the claimee
    let prizeClaimed = report.prizeType;
    // If a user was not boogied, push the prize.
    // Else activate the prize again
    if(!userInfo.isBoogie) {
      let user = prizes[prizeClaimed].claimedBy.filter((user)=>{
        if(userInfo.id === user.id){
          user.isClaimValid = report.isClaimValid;
          return user;
        }
      });
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
          claimedBy: userInfo.username
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
            text: prize[prizeClaimed].displayText
          },
          claimedBy: userInfo.username
        })
      }
    }
    else{
      prizes[prizeClaimed].isActive = true;
    }
    console.log(`Prize status ${JSON.stringify(prizes[prizeClaimed])}`);
  });

  socket.on('gameOver', async ()=>{
    // Show the users the screen with winners name and prizes
    let winners = await winnerStats()
      .catch((err)=>{
        return [];
      })
    io.emit('gameOver', winners);
  })

  socket.on('continueGame', ()=>{
    io.emit('continueGame', {});
  })

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