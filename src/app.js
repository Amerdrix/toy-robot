const Rx = require('rx')
const _ = require('lodash')

const tableBounds = { x: [0, 4], y: [0, 4] }

const directions = ['NORTH', 'EAST', 'SOUTH', 'WEST']

/*
  The main loop
  @param {Rx.Observable} input$ - A stream of commands to execute
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
  Executes an arbitrary command
  @param { Object } robotLocation - The current location of the robot
  @param { string } command - the command to parse and execute
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

  const [regex, handler] = _(commandList).find(([regex,]) => command.match(regex))
  return handler(robotLocation, ...command.match(regex))
}

/*
  Returns a rotated version of the robot location
  @param { number } turnDirection - a value representing the direction to turn. 1 for clockwise,  -1 for anti-clockwise
  @param { Object } robotLocation - The current location of the robot
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

/*
  Returns a moved version of the robot location
  @param { Object } robotLocation - The current location of the robot
*/
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
  const movementDirection = currentDirectionIndex < 2 ? 1 : -1 // Top/Right (0 and 1) are positive.
  const [min, max] = tableBounds[axis]


  return { robotLocation: Object.assign({}, robotLocation, { [axis]: Math.max(min, Math.min(max, robotLocation[axis] + movementDirection)) }) }
}

/*
  Returns the current location of the robot and a stdout message.
  @param { Object } robotLocation - The current location of the robot
*/
function report(robotLocation) {
  if (!robotLocation)
    return { err: 'Robot has not been placed' }

  return {
    std: `> ${robotLocation.x},${robotLocation.y} ${robotLocation.direction}`,
    robotLocation
  }
}

/*
  Returns a new version of the robot location based on arguments. If the location is invalid, the current location is returned
  @param { Object } robotLocation - The current location of the robot
  @param { string } cmd - the full place command
  @param { string } x - the x position
  @param { string } y - the y position
  @param { string } direction - the robots direction
*/
function place(robotLocation, cmd, x, y, direction) {
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

/*
  Returns the current location of the robot and a stderr message.
  @param { Object } robotLocation - The current location of the robot
  @param { string } command - The command which resulted in the error
*/
function error(robotLocation, command) {
  return {
    robotLocation,
    err: `The command ' ${command} ' could not be interpreted`
  }
}

/*
  Returns the a stream of objects where the given key is present
  @param { Rx.Observable<Object> } object$ - The stream of objects
  @param { string } Key - The key to check for
*/
function _selectPresentKeys(object$, key) {
  return object$.where(obj => key in obj).select(obj => obj[key])
}

exports.run = run;
exports.__int__ = {
  executeCommand
}
