const prizes = require('../config/prizes.constant');
const LOG = require('../utils').logger;
const component = 'prize';

let methods = {
  prizeList: prizes,
  getPrizeDisplayList(){
    let prizeList = []
    for(let prize in this.prizeList) {
      prizeList.push({
        type: prize,
        text: this.prizeList[prize].displayText
      });
    }
    return prizeList;
  },
  getActivePrizeList() {
    let activePrizes = [];
    for(let prize in this.prizeList) {
      // Get only active prize list
      if(this.prizeList.isActive) {
        activePrizes.push({
          type: prize,
          text: this.prizeList[prize].displayText
        });
      }
    }
    return activePrizes;
  },
  winnersList(){
    return new Promise((resolve, reject)=>{
      try {
        let winners = [],
          prizes = this.prizeList;

        LOG.info(`${component}.winnerStats`, null, prizes);

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
            if(winner && winner.length){
              info.winner = winner[0].user.username;
              winners.push(info);
            }
          }
        }
        resolve(winners);
      }
      catch(exc) {
        LOG.error(`${component}.winnerStats.exception`, null, exc);
        reject(exc);
      }
    })
  },
  resetPrizes(){
    // Reset All the prize in the game.
    for(let prize in this.prizeList){
      this.prizeList[prize].isActive = true;
      this.prizeList[prize].claimedBy = [];
    }
  }
}

module.exports = methods;