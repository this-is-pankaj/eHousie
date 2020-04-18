const LOG = require('../utils').logger;
const prizeMethods = require('./prize.component');
const methods= {};

methods.initialize = ()=>{
  // Reset the prizelist
  prizeMethods.resetPrizes();
  // Regenerate tickets for all users.
  // Reset the number bucket.
  // Clear the gameBoard
}

module.exports = methods;