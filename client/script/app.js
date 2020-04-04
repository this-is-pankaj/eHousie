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
    }
    str += '</tr></table>';
    $(".game-board").html(str);
  },
  generateBoardNumber() {
    return new Promise((resolve, reject) => {
      function generator() {
        let num = Math.floor((Math.random()*89)+1);
        return num;
      }
      
      let num = generator();
      if(this.generatedNum.indexOf(num)>-1){
        console.log(num);
        // Regenerate the board number if already gennerated number pops up.
        
      }
      else{
        this.generatedNum.push(num);
        resolve(num);
      }
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