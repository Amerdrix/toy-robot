const Rx = require('rx')

function executeCommand(command){
  if(command.match(/report/i))
    return {
      std: '1,1 NORTH'
    }
  if(command.match(/place/i)){
    return {}
  }

  return {
    err: `The command ' ${command} ' could not be interpreted`
  }
}

function selectPresentKeys(object$, key){
  return object$.where(obj => key in obj).select(obj => obj[key])
}


exports.run = (input) => {
    const commandResult$ = input.select(executeCommand).share()

    return {
        'std$': selectPresentKeys(commandResult$, 'std'),
        'error$': selectPresentKeys(commandResult$, 'err')
    };
}
