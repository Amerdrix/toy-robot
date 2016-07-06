const Rx = require('rx')
const _ = require('lodash')

const commandList = [
  [/^place (\d+),(\d+) (\w+)$/i, place],
  [/^report$/i, report],
  [/.*/, error]
]

function place(robotLocation, [cmd,x,y,direction]){

  return {
    robotLocation: {
      x: Number(x),
      y:Number(y),
      direction: direction.toUpperCase()}
  }
}
function report(robotLocation) {
  return {
    std: '1,1 NORTH',
    robotLocation
  }
}

function error(robotLocation, command){
  return {
    robotLocation,
    err: `The command ' ${command} ' could not be interpreted`
  }
}

function executeCommand(robotLocation, command){


  const [argumentRe, handler] = _(commandList).find(([re,]) => command.match(re))
  return handler(robotLocation, command.match(argumentRe))
}

function selectPresentKeys(object$, key){
  return object$.where(obj => key in obj).select(obj => obj[key])
}

function run (input) {
    const commandResult$ = input.select(cmd => executeCommand(null, cmd)).share()

    return {
        'std$': selectPresentKeys(commandResult$, 'std'),
        'error$': selectPresentKeys(commandResult$, 'err')
    };
}

exports.run = run;
exports.__int__ = {
  executeCommand
}
