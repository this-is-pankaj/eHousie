const LOG = require('../utils').logger;
const admin = {
  email: process.env.admin,
  id: ''  //Socket ID of the user
};

const methods = {
  users: {},  //{phone: {username, phone, email, id, ticket, role, isBoogie, isSpoiler}}
  setRole(user){
    if(user.email === admin.email) {
      user.role = 'admin';
      user.ticket = null;
    }
    return user;
  },
  getActiveUsers() {
    return new Promise((resolve, reject)=>{
      try{
        let list = [],
          users = this.users;
        for(let i in users) {
          // return only the name of active users
          if(users[i].isActive) {
            let info ={
              username: users[i].username
            }
            list.push(info);
          }
        }
        resolve(list);
      }
      catch(exc){
        reject(exc);
      }
    })
  },
  addUser(userInfo){
    return new Promise((resolve, reject)=>{
      try{
        // Set the flag of the user to active..
        // ID & ticket will be set by the parent function
        userInfo.isActive = true;
        if(this.users[userInfo.phone]){
          // If a user was a spoiler, don't let him in.
          if(this.users[userInfo.phone].isSpoiler) {
            reject(`${this.users[userInfo.phone]}`);
          }
          else {
            userInfo = Object.assign(this.users[userInfo.phone], userInfo);
          }
        }
        else{
          this.users[userInfo.phone] = userInfo;
        }
      }
      catch(exc){
        reject(exc);
      }
    })
  }
};

module.exports = methods;