'use strict';
let storageId = '';
let boardMethods = {
  generatedNum: [],
  generateGameBoard() {
    this.generatedNum.length = 0;
    let str ='<table class="table table-bordered">';
    for(let i=1; i<=90; i++){
      if(i%10 === 1){
        str += `</tr><tr>`
      }
      str += `<td id=b${i} class="board-num"> ${i} </td>`;
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
  generateTicket(socket, ticket) {
    let str ='<table class="table table-bordered">';
    for(let row=0; row<ticket.length; row++) {
      str += `<tr>`;
      for(let col=0; col<ticket[row].length; col++) {
        str += `<td id=t${row}${col} class="ticket-num"> ${ticket[row][col] || ''} </td>`;
      }
      str += `</tr>`;
    }
    str += `</table>
      <div class="content-section">
        <h1 class="new-num text-center">And the number is...</h1>
        <div class="player-options"></div>
      </div>`;
    $(".user-ticket-wrapper").html(str);
    this.bindTicketMethod(socket);
    this.populateLastSelections();
  },
  generatePrizeList(prizeList, socket) {
    let str = `<h3 class="prize-title">Claim Prize</h3>`;

    for(let i=0; i< prizeList.length; i++){
      str += `<button class="btn btn-round claim-btn" data-prize=${prizeList[i].type} disabled>${prizeList[i].text} <br/> <small>(${prizeList[i].amount}) </small></button>`;
    }

    $(".user-ticket-wrapper").find(".player-options").html(str);
    this.bindPrizeMethod(socket);
  },
  bindTicketMethod(socket) {
    $(".ticket-num").off().on("click", function(){
      $(this).toggleClass("matched");
      let numId = $(this).attr("id");
      let numbers = JSON.parse(storageMethods.getStorage());
      if($(this).hasClass("matched")) {
        if(!numbers){
          numbers=[];
        }
        numbers.push(numId);
      }
      else{
        if(numbers) {
          if(numbers.indexOf(numId)>-1)
            numbers.splice(numbers.indexOf(numId), 1);
        }
      }

      storageMethods.setStorage(numbers);

    });
  },
  bindPrizeMethod(socket){
    $(".claim-btn").off().on("click", function(){
      socket.emit("claimPrize", {type: $(this).data("prize")});
      $(this).attr("disabled", true);
    });
  },
  populateLastSelections() {
    let numbers = JSON.parse(storageMethods.getStorage());
    if(numbers && numbers.length) {
      for(let i=0; i<numbers.length; i++){
        $(`#${numbers[i]}`).addClass("matched");
      }
    }
  }
}

let storageMethods = {
  getStorage: function(){
    return localStorage.getItem(storageId);
  },
  setStorage: function(val){
    localStorage.setItem(storageId, JSON.stringify(val));
  },
  deleteStorage: function() {
    localStorage.removeItem(storageId);
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

let adminConsole = {
  bindValidators(socket) {
    $(".claim-validator").off().on("click", function(){
      let obj = {
        id: $(this).parents(".claim-item").attr("id"),
        prizeType: $(this).parents(".claim-item").data("prize"),
        isClaimValid: $(this).data("status")
      }

      socket.emit('validation', obj);
    })
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
        $(`#b${pickedNumbers[i]}`).text(pickedNumbers[i]).addClass("done");
      }
      $(".new-num").text(lastPicked);
      $(`#b${lastPicked}`).addClass("last");
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

  $(".continue-game").off().on("click", ()=>{
    socket.emit('continueGame', {});
  });

  $(".game-over").off().on("click", ()=>{
    socket.emit('gameOver');
  });

  $(".close-prize").off().on("click", function(){
    $(this).parents(".claim-notification").addClass("hide");
  })

  socket.on('continueGame', (data)=>{
    cleanUpdateColumn();
  })

  socket.on('newNumber', (data)=>{
    // Activate the claim prize button only if the game has started
    if(data.numbersPicked && data.numbersPicked.length){
      $(".claim-btn").attr("disabled", false);
    }

    $("#picked").trigger("play");
    let num = data.newNum;
    $(".done").removeClass("last");
    $(".new-num").text(num);
    $(`#b${num}`).text(num).addClass("done last");
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

    // If all values pass.. send the value to the server.
    socket.emit('userJoined', info);
    $(".notification").html(`<span class="notification-text">You joined </span>`).removeClass("hide");
    $(".user-form-wrapper").remove();
    clearNotification();
  });

  socket.on('userJoined', (data)=>{
    let newUser = data.newUser;
    let userList = data.users;
    console.log(data);
    // Activate the claim prize button only if the game was already started/in progress
    if(data.numbersPicked && data.numbersPicked.length){
      $(".claim-btn").attr("disabled", false);
    }

    $(".notification").html(`<span class="notification-text">${newUser} joined </span>`).removeClass("hide");
    playersMethod.generateList(userList);
    if(data.role === 'admin'){
      boardMethods.enableAdminConsole();
    }
    clearNotification();
  });

  socket.on('userLeft', (data)=>{
    let userLeft = data.userLeft;
    let userList = data.users;

    $(".notification").html(`<span class="notification-text">${userLeft} left </span>`).removeClass("hide");
    playersMethod.generateList(userList);
    clearNotification();
  });

  socket.on('your ticket', (data)=>{
    if(data.ticket && data.ticket.length){
      storageId = data.gameId;
      ticketMethods.generateTicket(socket, data.ticket);
    }
  });

  socket.on('generatePrize', (info)=>{
    let prizeList = info.prizeList;
    ticketMethods.generatePrizeList(prizeList, socket);
    // Activate the claim prize button only if the game was already started/in progress
    if(info.numbersPicked && info.numbersPicked.length){
      $(".claim-btn").attr("disabled", false);
    }
  })

  socket.on('prizeClaim', (data)=>{
    clearNotification();
    $(".claim-notification").removeClass("hide").find('.prize-body').append(`<p class="prize-text">${data.claimedBy} has claimed for ${data.prize.text}</p>`);
    $(`[data-prize=${data.prize.type}]`).addClass("hide");
  });

  socket.on('alreadyClaimed', (data)=> {
    clearNotification();
    $(".claim-notification").removeClass("hide").find('.prize-body').append(`<p class="prize-text">${data.claimedBy} has already claimed for ${data.prize.text}</p>`);
  });

  socket.on('reviewClaim', (data)=>{
    console.log(data);
    let str = `<li class="claim-item" id="${data.claimedBy.id}" data-prize=${data.prize.type}>
      <p class="claimed-by">${data.claimedBy.username} has claimed for ${data.prize.text}.</p>
      <p> 
        <button class="btn btn-success claim-validator" data-status=true>Approve</button>
        <button class="btn btn-danger claim-validator" data-status=false>Reject</button> 
      </p>
      <h5>Ticket: </h5>
      <table class="table table-bordered">`;
      if(data.ticket) {
        for(let t=0; t<data.ticket.length; t++) {
          str +=`<tr>`
          for(let n=0; n<data.ticket[t].length;n++) {
            str += `<td> ${data.ticket[t][n] || ''} </td>`
          }
          str +=`</tr>`
        }
      }
      else{
        str += `<tr><td>Ticket Unavailable</td></tr>`;
      }
      str += `</table>
    </li>`;
    $(".claim-list").append(str);
    adminConsole.bindValidators(socket);
  });

  socket.on('claimReviewed', (data)=>{
    console.log(data);
    if(data.isClaimValid) {
      $("#win").trigger("play");
      $(".claim-notification").removeClass("hide").find(".prize-body").append(`<p class="prize-text">${data.claimedBy} has claimed for ${data.prize.text} and WON!</p>`);
      $(`[data-prize=${data.prize.type}]`).addClass("hide");
    }
    else{
      $("#boo").trigger("play");
      $(".claim-notification").removeClass("hide").find(".prize-body").append(`<p class="prize-text">${data.claimedBy} has claimed for ${data.prize.text} and has been BBOOGIEEEDD!</p>`);
      $(`[data-prize=${data.prize.type}]`).removeClass("hide");
    }
  });

  socket.on('boogie', (data)=>{
    $(".claim-btn").remove();

    if(data && data.spoiler) {
      $(".board-manager").remove();
    }
  });

  socket.on('gameOver', (data)=>{
    console.log(data);
    $("#win").trigger("play");
    let winners = data.winners;
    let str=`<h2 class="text-center">Game Over</h2>`;
    if(winners.length){
      str = `<h2 class="text-cennter"> Winners </h2>`;
      for(let i=0; i<winners.length; i++) {
        str += `<p class="winner prize-text">${winners[i].text} : ${winners[i].winner}`;
      }
    }
    $(".claim-notification").removeClass("hide").find(".prize-body").addClass("game-over").html(str);
    storageMethods.deleteStorage();
    // storageMethods.resetStorageValues(locConfig, ticketMatch);
  });

  socket.on('disconnect', ()=>{
    $(".support").removeClass("hide");
  });

  $(".reload").off().on("click", function(){
    window.location.reload();
  })

  function clearNotification() {
    setTimeout(function(){
      $(".notification").html('').addClass("hide");
    }, 3000);
  }

  function cleanUpdateColumn () {
    $(".claim-notification").addClass("hide").find(".prize-body").html("");
  }
}
$(document).ready(initialize);