module.exports = {
  numberBucket: [],
  initializeGameBoard() {
    for(let i=1; i<=90;i++) {
      this.numberBucket.push(i);
    }
  },
  pickNumber() {
    return new Promise((resolve, reject) => {
      function generator(max) {
        let num = Math.floor(Math.random()*(max));
        return num;
      }
      
      let num = generator(this.numberBucket.length);

      let selectedNum = this.numberBucket[num];
      this.numberBucket.splice(num, 1);
      resolve(selectedNum);
    })
  }
}