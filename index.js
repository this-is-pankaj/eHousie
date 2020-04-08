'use strict';
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ticket = require('./server/generateTicket');
const admin = {
  email: 'panks@8013545945.ph',
  id: ''
};
const prizes = {
  firstLine: {
    isActive: true,
    displayText: "First Line",
    claimedBy: []
  },
  secondLine: {
    isActive: true,
    displayText: "Second Line",
    claimedBy: []
  },
  thirdLine: {
    isActive: true,
    displayText: "Third Line",
    claimedBy: []
  },
  fullHouse1: {
    isActive: true,
    displayText: "1st Full House",
    claimedBy: []
  },
  fullHouse2: {
    isActive: true,
    displayText: "2nd Full House",
    claimedBy: []
  }
}
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
      socket.broadcast.emit('userJoined', {
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

  socket.on('claimPrize', (info)=>{
    try{
      let claimList = prizes[info.type].claimedBy;
      if(prizes[info.type].isActive) {
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
          claimedBy: socket.user.phone
        })
      }
      else {
        prizes[info.type].claimedBy.push({user: socket.user , id: socket.id});
        socket.emit('alreadyClaimed', {
          prize: {
            type: info.type,
            text: prizes[info.type].displayText
          },
          claimedBy: claimList[claimList.length-1].user
        }) 
      }
    }
    catch(exc) {

    }
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