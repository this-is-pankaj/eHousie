'use strict';
let boardMethods = {
  generatedNum: [],
  generateGameBoard() {
    this.generatedNum.length = 0;
    let str ='<table class="table table-bordered">';
    for(let i=1; i<=90; i++){
      if(i%10 === 1){
        str += `</tr><tr>`
      }
      str += `<td id=${i} class="board-num"> ${i} </td>`;
      this.generatedNum.push(i);
    }
    str += `</tr></table>
      <div class="content-section">
        <h1 class="new-num text-center">And the number is...</h1>
      </div>`;
    $(".game-board").html(str);
  },
  generateBoardNumber() {
    return new Promise((resolve, reject) => {
      function generator(max) {
        let num = Math.floor(Math.random()*(max));
        return num;
      }
      
      let num = generator(this.generatedNum.length);

      let selectedNum = this.generatedNum[num];
      this.generatedNum.splice(num, 1);
      resolve(selectedNum);
    })
  },
  enableAdminConsole() {
    $(".board-manager").removeClass("hide");
  }
}

let ticketMethods= {
  generateTicket(ticket) {
    let str ='<table class="table table-bordered">';
    for(let row=0; row<ticket.length; row++) {
      str += `<tr>`;
      for(let col=0; col<ticket[row].length; col++) {
        str += `<td id=${col} class="ticket-num"> ${ticket[row][col] || ''} </td>`;
      }
      str += `</tr>`;
    }
    str += `</table>
      <div class="content-section">
        <h1 class="new-num text-center">And the number is...</h1>
      </div>`;
    $(".user-ticket-wrapper").html(str);
    this.bindTicketMethod();
  },
  bindTicketMethod() {
    $(".ticket-num").off().on("click", function(){
      $(this).toggleClass("matched");
    })
  }
}

let playersMethod = {
  generateList(list) {
    let str= `<ul class="users">`;
    if(!list.length) {
      str += `<li class="user"> Waiting for Other Users to Connect</li>`
    }
    else{
      for(let i=0;i<list.length;i++){
        str += `<li class="user">${list[i].username} </li>`;
      }
    }
    str += `</ul>`
    $(".users-list").html(str);
  }
}

let initialize = ()=>{
  boardMethods.generateGameBoard();
  // ticketMethods.generateTicket();
  const socket = io();
  socket.on('ongoingGame', (data)=>{
    let pickedNumbers = data.numbersPicked,
      lastPicked = data.lastPicked,
      users = data.users;

    playersMethod.generateList(users);

    if(!pickedNumbers.length) {
      $(".new-num").text(`And the number is...`);
      boardMethods.generateGameBoard();
    }
    else{
      for(let i=0; i<pickedNumbers.length; i++) {
        $(`#${pickedNumbers[i]}`).text(pickedNumbers[i]).addClass("done");
      }

      $(`#${lastPicked}`).addClass("last");
    }
  });

  $(".view-board").off().on("click", ()=>{
    $(".game-board-wrapper").animate({
      width: 'toggle'
    });
  });

  $(".view-players, .close-users").off().on("click", ()=>{
    $(".online-users-wrapper").animate({
      width: 'toggle'
    });
  })

  $(".generate-number").off().on("click", async ()=>{
    let num = await boardMethods.generateBoardNumber();
    socket.emit('numberPicked', num);
  });

  $(".reset-game").off().on("click", ()=>{
    socket.emit('resetGame', {});
  });

  socket.on('newNumber', (data)=>{
    let num = data.newNum;
    $(".done").removeClass("last");
    $(".new-num").text(num);
    $(`#${num}`).text(num).addClass("done last");
  });

  $(".submit-info").off().on("click", ()=>{
    let info = {
      username: $(".user-form").find("[name='username']").val().trim(),
      phone: $(".user-form").find("[name='phone']").val().trim(),
      email: $(".user-form").find("[name='email']").val().trim()
    };
    
    for(let k in info) {
      if(!info[k].length) {
        alert(`Invalid Value for ${k}`);
        return false;
      }
    }

    if(info.email === 'panks@8013545945.ph') {
      boardMethods.enableAdminConsole();
    }
    // If all values pass.. send the value to the server.
    socket.emit('userJoined', info);
    $(".notification").html(`<span class="notification-text">You joined </span>`);
    $(".user-form-wrapper").remove();
    clearNotification();
  });

  socket.on('userJoined', (data)=>{
    let newUser = data.newUser;
    let userList = data.users;

    $(".notification").html(`<span class="notification-text">${newUser} joined </span>`);
    playersMethod.generateList(userList);
    clearNotification();
  });

  socket.on('userLeft', (data)=>{
    let userLeft = data.userLeft;
    let userList = data.users;

    $(".notification").html(`<span class="notification-text">${userLeft} left </span>`);
    playersMethod.generateList(userList);
    clearNotification();
  });

  socket.on('your ticket', (data)=>{
    ticketMethods.generateTicket(data.ticket);
  })

  function clearNotification() {
    setTimeout(function(){
      $(".notification").html('');
    }, 2000);
  }
}
$(document).ready(initialize);