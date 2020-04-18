const methods = {};
const appStatic = require('./config/app.constant');
const numConfig = appStatic.numConfig;
const LOG = require('../utils').logger;
const component = 'generateTicket';

methods.generateNum = (min, max, count)=>{
  return new Promise((resolve, reject)=>{
    try{
      let arr=[];
      for(let i=0;i<count;i++){
        let n= Math.floor((Math.random()*(max-min+1))+min);
        arr.push(n);
      }
      resolve(arr);
    }
    catch(exc){
      reject(exc);
    }
  })
};

methods.generateRandomNumber = (min, max) => {
  return Math.floor((Math.random()*(max-min+1)+min));
}

methods.generateTicket = (numList) => {
  return new Promise(async (resolve, reject)=>{
    let validationBucket = {};
    let bucket= [0,1,2,3,4,5,6,7,8];
    let ticket = [];
    // Print the 3 rows of the ticket as 3 arrays of length 9
    // Start with printing 1st 2 rows. If any column is missed out, make sure to print in the 3rd one.
    for(let i=0;i<2;i++) {
      ticket[i] = new Array(9); // Create Array of length 9
      await pickValidNumbers(ticket[i]);
    }
    ticket[2]  = new Array(9); // Create Array of length 9
    // Check the tens/columns covered
    let columnsPushed = Object.keys(validationBucket);
    // If the length is 9, that means all 9 columns exist, so we can randomly generate more columns
    // Else get the missing column numbers and eensure they exist in this ticket row.
    if(columnsPushed.length === 9) {
      await pickValidNumbers(ticket[2]);
    }
    else{
      // Get the columns missing from the array.
      let missedCols= [];
      for(let i=0; i<9;i++) {
        if(!validationBucket[i]){
          missedCols.push(i);
        }
      }
      await pickValidNumbers(ticket[2], missedCols)
        .catch((err)=>{
          LOG.error(`${component}.generateTicket.pickValidNumbers`,null,`Error Occurred when genenrating ticket ${err}`);
        })
    }
    console.log(ticket);
    function pickValidNumbers(list, suggestedCol) {
      return new Promise((resolve, reject)=>{
        // Pick 5 numbers for the row of the ticket. The numbers should be valid.
        let validPick = 5;
        let bucketDoneList = [];
        do{
          if(bucket.length<3) {
            bucket = [0,1,2,3,4,5,6,7,8];
          }

          let bucketNum,randBucket = '';
          if(suggestedCol && suggestedCol.length) {
            // console.log(`Suggested Col ${suggestedCol} and bucket is ${bucket}`)
            bucketNum = suggestedCol[0];
            randBucket = bucket.indexOf(bucketNum);
            suggestedCol.splice(0,1);
          }
          else {
            randBucket = methods.generateRandomNumber(0,bucket.length-1);
            bucketNum = bucket[randBucket];
          }
          if(bucketDoneList.indexOf(bucketNum)>-1) {
            // console.log(`bucket already picked for this round`);
          }
          else{
            if(randBucket>-1){
              bucket.splice(randBucket,1);
            }
            
            bucketDoneList.push(bucketNum);
            // console.log(`Random picked ${randBucket} to pick col ${bucketNum} and got ${numList[bucketNum]} list with bucket length ${bucket}`);
            if(numList[bucketNum] && numList[bucketNum].length && numList[bucketNum][0]) {
              // console.log(`List is ${list}, nnumlist is ${numList} and bucketNum is ${bucketNum}`)
              list[bucketNum] = numList[bucketNum][0];
              // Remove the index
              numList[bucketNum].splice(0,1);
              validPick--;
              // Push the chosen tens section from bucket in the validation bucket
              validationBucket[bucketNum] = true;
            }
          }
        }
        while(validPick);
        resolve(list);
      });
    }
    resolve(ticket);
  })
}

methods.generateRandomTicket = ()=>{
  return new Promise(async (resolve, reject)=>{
    let numList = [];
    for(let i=0;i<numConfig.numInCol.length;i++) {
      let count = Math.floor((Math.random()*numConfig.maxNumInCol)+numConfig.minNumInCol);
      let numbers = await methods.generateNum(numConfig.numInCol[i].min, numConfig.numInCol[i].max, count)
        .catch((exc)=>{
          console.log('number genneration error');
        });
      // Filter array for unique numbebrs and then sort them.
      numbers = [...new Set(numbers)].sort();
      numList.push(numbers);
    }
    // console.log(numList);
    let finalTicket = await methods.generateTicket(numList);
    resolve(finalTicket);
  })
}

module.exports = methods;