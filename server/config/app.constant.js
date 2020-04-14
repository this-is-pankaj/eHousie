const _statics = {
  prizes: {
    early7: {
      isActive: true,
      displayText: "Early 7",
      claimedBy: [] // {user: socket.user , id: socket.id, isClaimValid: Boolean} array
    },
    corners: {
      isActive: true,
      displayText: "Corners",
      claimedBy: []
    },
    firstLine: {
      isActive: true,
      displayText: "First Line",
      claimedBy: []
    },
    secondLine: {
      isActive: true,
      displayText: "Second Line",
      claimedBy: []
    },
    thirdLine: {
      isActive: true,
      displayText: "Third Line",
      claimedBy: []
    },
    fullHouse1: {
      isActive: true,
      displayText: "1st Full House",
      claimedBy: []
    },
    fullHouse2: {
      isActive: true,
      displayText: "2nd Full House",
      claimedBy: []
    }
  },
  numConfig: {
    maxNumInCol: 3,
    minNumInCol: 2,
    numInCol: [
      {
        min: 1,
        max: 9
      },
      {
        min: 10,
        max: 19
      },
      {
        min: 20,
        max: 29
      },
      {
        min: 30,
        max: 39
      },
      {
        min: 40,
        max: 49
      },
      {
        min: 50,
        max: 59
      },
      {
        min: 60,
        max: 69
      },
      {
        min: 70,
        max: 79
      },
      {
        min: 80,
        max: 90
      }
    ]
  }
};