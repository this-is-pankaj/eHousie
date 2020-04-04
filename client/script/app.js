'use strict';
let boardMethods = {
  generatedNum: [],
  generateGameBoard() {
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
  }
}

let initialize = ()=>{
  boardMethods.generateGameBoard();
  $(".generate-number").off().on("click", async ()=>{
    let num = await boardMethods.generateBoardNumber();
    $(".new-num").text(num);
    $(`#${num}`).text(num).addClass("done");
  })
}
$(document).ready(initialize);