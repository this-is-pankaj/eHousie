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
    str += '</tr></table>';
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

let initialize = ()=>{
  boardMethods.generateGameBoard();
  const socket = io();
  socket.on('ongoingGame', (data)=>{
    let pickedNumbers = data.numbersPicked,
      lastPicked = data.lastPicked;
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
    $(".user-form-wrapper").remove();
  });

  socket.on('userJoined', (data)=>{
    let newUser = data.newUser;
    let userList = data.users;

    alert(`${newUser.username} just joined`);
  })
}
$(document).ready(initialize);