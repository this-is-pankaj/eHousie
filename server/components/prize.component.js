const appStatics = require('../config/app.constant');
const LOG = require('../utils').logger;
const component = 'prize';

let methods = {
  prizeList: appStatics.prizes,
  getPrizeDisplayList(){
    let prizes = []
    for(let prize in this.prizeList) {
      prizes.push({
        type: prize,
        text: this.prizeList[prize].displayText
      });
    }
    return prizes;
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
}

module.exports = methods;