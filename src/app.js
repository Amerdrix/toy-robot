const Rx = require('rx')
const _ = require('lodash')

const tableBounds = { x: [0, 4], y: [0, 4] }

const directions = ['NORTH', 'EAST', 'SOUTH', 'WEST']

/*
  This is the main loop. It takes an Rx.Observable of strings whcih represent commands to the robot
*/
function run(input$) {
  const commandResult$ = input$
    .scan((state, command) => executeCommand(state.robotLocation, command), {})
    .share()
  return {
    'std$': _selectPresentKeys(commandResult$, 'std'),
    'error$': _selectPresentKeys(commandResult$, 'err')
  };
}

/*
  The main command handler. This is responsible for taking the existing robot, a command, and then returning an object in the form of
   { 
     robotLocation: {x:number,y:number,direction:string}
     error?: string
     std?: string
    }
*/
function executeCommand(robotLocation, command) {
  const commandList = [
    [/^place (-?\d+),(-?\d+),(\w+)$/i, place],
    [/^report$/i, report],
    [/^move$/i, move],
    [/^left$/i, turnLeft],
    [/^right$/i, turnRight],
    [/.*/, error]
  ]

  const [argumentRe, handler] = _(commandList).find(([re,]) => command.match(re))
  return handler(robotLocation, command.match(argumentRe))
}

/*
  Takes a direction and robot location. Returns a new robot location rotated in that direction.
  The order of arguments is configured to make curring to left/right easy. 
*/
function turn(turnDirection, robotLocation) {
  if (!robotLocation)
    return { err: 'Robot has not been placed' }

  const currentDirectionIndex = directions.indexOf(robotLocation.direction)
  const indexOfNewDirection = (currentDirectionIndex + turnDirection + directions.length) % directions.length
  return { robotLocation: Object.assign({}, robotLocation, { direction: directions[indexOfNewDirection] }) }
}
const turnLeft = _.curry(turn)(-1)
const turnRight = _.curry(turn)(1)

function move(robotLocation) {
  if (!robotLocation)
    return { err: 'Robot has not been placed' }

  const currentDirectionIndex = directions.indexOf(robotLocation.direction)

  /*
  Ascii art compass for help understanding the axis and movementDirection calcs
          N: 0
     W:3  -|-  E:1
          S: 2       
  */
  const axis = currentDirectionIndex % 2 === 0 ? 'y' : 'x'; // North/South are even - East/West are odd 
  const movementDirection = currentDirectionIndex < 2 ? 1 : -1 // Top/Right (< 2) are positive.
  const [min, max] = tableBounds[axis]


  return { robotLocation: Object.assign({}, robotLocation, { [axis]: Math.max(min, Math.min(max, robotLocation[axis] + movementDirection)) }) }
}

function report(robotLocation) {
  if (!robotLocation)
    return { err: 'Robot has not been placed' }

  return {
    std: `> ${robotLocation.x},${robotLocation.y} ${robotLocation.direction}`,
    robotLocation
  }
}

function place(robotLocation, [cmd, x, y, direction]) {
  if (!_(directions).includes(direction.toUpperCase())) {
    return { robotLocation, err: `${direction} must be one of ${directions}` }
  }

  if (x < tableBounds.x[0] || x > tableBounds.x[1] || y < tableBounds.y[0] || y > tableBounds.y[1]) {
    return { robotLocation, err: `${x},${y} must be within ${tableBounds.x[0]}:${tableBounds.x[1]},${tableBounds.y[0]}:${tableBounds.y[1]}` }
  }

  return {
    robotLocation: {
      x: Number(x),
      y: Number(y),
      direction: direction.toUpperCase()
    }
  }
}

function error(robotLocation, command) {
  return {
    robotLocation,
    err: `The command ' ${command} ' could not be interpreted`
  }
}

function _selectPresentKeys(object$, key) {
  return object$.where(obj => key in obj).select(obj => obj[key])
}

exports.run = run;
exports.__int__ = {
  executeCommand
}
