const Rx = require('rx')
const _ = require('lodash')

const directions = ['NORTH', 'EAST', 'SOUTH', 'WEST']  

function run (input) {
    const commandResult$ = input
      .scan((state, command) => executeCommand(state.robotLocation, command), {})
      .share()
    return {
        'std$': _selectPresentKeys(commandResult$, 'std'),
        'error$': _selectPresentKeys(commandResult$, 'err')
    };
}

function executeCommand(robotLocation, command){
  const commandList = [
    [/^place (\d+),(\d+) (\w+)$/i, place],
    [/^report$/i, report],
    [/^move$/i, move],
    [/^left$/i, turnLeft],
    [/^right$/i, turnRight],
    [/.*/, error]
  ]
  
  const [argumentRe, handler] = _(commandList).find(([re,]) => command.match(re))
  return handler(robotLocation, command.match(argumentRe))
}

function turn(turnDirection, robotLocation)
{
  if(!robotLocation)
    return {err: 'Robot has not been placed'}

  const currentDirectionIndex = directions.indexOf(robotLocation.direction)
  const indexOfNewDirection = (currentDirectionIndex + turnDirection + 4) % 4
  return  Object.assign({}, robotLocation, {direction: directions[indexOfNewDirection] })
}
const turnLeft = _.curry(turn)(-1)
const turnRight = _.curry(turn)(1)

function move(robotLocation) {
   if(!robotLocation)
    return {err: 'Robot has not been placed'}
}

function report(robotLocation) {
  if(!robotLocation)
    return {err: 'Robot has not been placed'}
    
  return {
    std: `> ${robotLocation.x},${robotLocation.y} ${robotLocation.direction}`,
    robotLocation
  }
}

function place(robotLocation, [cmd,x,y,direction]){
  return {
    robotLocation: {
      x: Number(x),
      y:Number(y),
      direction: direction.toUpperCase()}
  }
}

function error(robotLocation, command){
  return {
    robotLocation,
    err: `The command ' ${command} ' could not be interpreted`
  }
}

function _selectPresentKeys(object$, key){
  return object$.where(obj => key in obj).select(obj => obj[key])
}

exports.run = run;
exports.__int__ = {
  executeCommand
}
