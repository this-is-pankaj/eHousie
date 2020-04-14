const utils ={
  logger: {
    info: (component, reqId, msg)=>{
      try{
        let log = {
          type: info,
          component,
          reqId,
          msg: JSON.stringify(msg)
        }
        console.log(log);
      }
      catch(exc){
        let log = {
          type: info,
          component,
          reqId,
          msg
        }
        console.log(log);
      }
    },
    error: (component, reqId, msg)=>{
      try{
        let log = {
          type: error,
          component,
          reqId,
          msg: JSON.stringify(msg)
        }
        console.log(log);
      }
      catch(exc){
        let log = {
          type: error,
          component,
          reqId,
          msg
        }
        console.log(log);
      }
    }
  }
}

module.exports = utils;