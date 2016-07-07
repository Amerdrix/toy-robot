const expect = require('chai').expect
const Rx = require('rx')
const app = require('../src/app')


describe('app.js', () => {

  /// --------- #run -------------- 
  describe('#run', () => {
    let output = null;

    beforeEach(() => {
      output = Rx.ReplaySubject()
    })

    describe('when there is no input', () => {
      const input$ = new Rx.Observable.empty()
      it('there no std output', (done) => {
        app.run(input$).std$.count().subscribe(count => {
          expect(count).to.eql(0)
          done()
        })
      })
      it('there no error output', (done) => {
        app.run(input$).error$.count().subscribe(count => {
          expect(count).to.eql(0)
          done()
        })
      })
    })

    describe('when there is jibberish input', () => {
      const jibberish = 'asoeuhsaoteu'

      const input$ = new Rx.Observable.just(jibberish)

      it('there no std output', (done) => {
        app.run(input$).std$.count().subscribe(count => {
          expect(count).to.eql(0)
          done()
        })
      })

      it('there error explaining the error', (done) => {
        app.run(input$).error$.first().subscribe(error => {
          expect(error).to.eql(`The command ' ${jibberish} ' could not be interpreted`)
          done()
        })
      })
    })

    describe('when there is a REPORT command following a valid PLACE command', () => {
      const place = 'PLACE 1,1,NORTH'
      const report = 'REPORT'

      const input$ = new Rx.Observable.from([place, report])

      it('the status of the robot is reported', (done) => {
        app.run(input$).std$.first().subscribe(output => {
          expect(output).to.eql('> 1,1 NORTH')
          done()
        })
      })

      it('there no error output', (done) => {
        app.run(input$).error$.count().subscribe(count => {
          expect(count).to.eql(0)
          done()
        })
      })
    })

    describe('acceptance tests', () => {
      it('scenario A', (done) => {

        const input$ = new Rx.Observable.from([
          'PLACE 0,0,NORTH',
          'MOVE',
          'REPORT'])

        app.run(input$).std$.first().subscribe(output => {
          expect(output).to.eql('> 0,1 NORTH')
          done()
        })
      })

      it('scenario B', (done) => {

        const input$ = new Rx.Observable.from([
          'PLACE 0,0,NORTH',
          'LEFT',
          'REPORT'])

        app.run(input$).std$.first().subscribe(output => {
          expect(output).to.eql('> 0,0 WEST')
          done()
        })
      })

      it('scenario C', (done) => {

        const input$ = new Rx.Observable.from([
          'PLACE 1,2,EAST',
          'MOVE',
          "MOVE",
          "LEFT",
          "MOVE",
          'REPORT'])

        app.run(input$).std$.first().subscribe(output => {
          expect(output).to.eql('> 3,3 NORTH')
          done()
        })
      })
    })
  })

  /// --------- #executeCommand --------------
  describe('#executeCommand', () => {
    describe('when the command is jibberish', () => {
      const jibberish = 'asoeuhsaoteu'

      it('returns the robotLocation unchanged', () => {
        const robotLocation = {}
        const result = app.__int__.executeCommand(robotLocation, jibberish)
        expect(result.robotLocation).to.be.equal(robotLocation)
      })
    })

    describe('REPORT', () => {
      const command = 'REPORT'
      WhenTheRobotHasNotBeenPlaced((robotLocation) => {
        const result = app.__int__.executeCommand(robotLocation, command)
        expect(result).to.be.eql({ err: 'Robot has not been placed' })
      })

      describe('when the robot has been placed at 0,0 NORTH', () => {
        const robotLocation = { x: 0, y: 0, direction: 'NORTH' }
        const result = app.__int__.executeCommand(robotLocation, command)
        expect(result).to.be.eql({ robotLocation, std: '> 0,0 NORTH' })
      })

      describe('when the robot has been placed at 3,2 WEST', () => {
        const robotLocation = { x: 3, y: 2, direction: 'WEST' }
        const result = app.__int__.executeCommand(robotLocation, command)
        expect(result).to.be.eql({ robotLocation, std: '> 3,2 WEST' })
      })
    })

    describe('PLACE', () => {
      describe('when the place command is valid', () => {
        const command = 'PLACE 1,2,NORTH'
        it('returns the robotLocation as per the command ', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)

          expect(result.robotLocation).to.be.eql({ x: 1, y: 2, direction: 'NORTH' })
        })
      })

      describe('when the place command has mixed case', () => {
        const command = 'PlaCe 4,1,noRTh'

        it('returns the robotLocation as per the command ', () => {
          const robotLocation = {}

          const result = app.__int__.executeCommand(robotLocation, command)

          expect(result.robotLocation).to.be.eql({ x: 4, y: 1, direction: 'NORTH' })
        })
      })

      describe('when the place command has an invalid direction', () => {
        const command = 'PLACE 1,2,Nrt'

        it('returns the robotLocation unchanged', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.equal(robotLocation)
        })

        it('returns an error', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)

          expect(result.err).to.not.be.null
        })
      })


      describe('when the place command has an invalid Y position', () => {
        const command = 'PLACE 1,200,WEST'

        it('returns the robotLocation unchanged', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.equal(robotLocation)
        })

        it('returns an error', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)

          expect(result.err).to.not.be.null
        })
      })


      describe('when the place command has an invalid X position', () => {
        const command = 'PLACE 50,2,WEST'

        it('returns the robotLocation unchanged', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.equal(robotLocation)
        })

        it('returns an error', () => {
          const robotLocation = {}
          const result = app.__int__.executeCommand(robotLocation, command)

          expect(result.err).to.not.be.null
        })
      })
    })

    describe('MOVE', () => {
      const command = 'MOVE'
      WhenTheRobotHasNotBeenPlaced((robotLocation) => {
        it('returns an error message', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result).to.be.eql({ err: 'Robot has not been placed' })
        })
      })

      describe("when the robots direction is NORTH", () => {
        describe("and is in a position where it can move", () => {
          const robotLocation = { x: 0, y: 0, direction: 'NORTH' }

          it("moves north incrementing 'y' ", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql({ x: 0, y: 1, direction: 'NORTH' })
          })
        })

        describe("and is in a position where it cannot move", () => {
          const robotLocation = { x: 0, y: 4, direction: 'NORTH' }

          it("does not move", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql(robotLocation)
          })
        })
      })

      describe("when the robots direction is EAST", () => {
        describe("and is in a position where it can move", () => {
          const robotLocation = { x: 0, y: 0, direction: 'EAST' }

          it("moves EAST incrementing 'y' ", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql({ x: 1, y: 0, direction: 'EAST' })
          })
        })

        describe("and is in a position where it cannot move", () => {
          const robotLocation = { x: 4, y: 0, direction: 'EAST' }

          it("does not move", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql(robotLocation)
          })
        })
      })

      describe("when the robots direction is SOUTH", () => {
        describe("and is in a position where it can move", () => {
          const robotLocation = { x: 0, y: 3, direction: 'SOUTH' }

          it("moves SOUTH decrementing 'y' ", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql({ x: 0, y: 2, direction: 'SOUTH' })
          })
        })

        describe("and is in a position where it cannot move", () => {
          const robotLocation = { x: 0, y: 0, direction: 'SOUTH' }

          it("does not move", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql(robotLocation)
          })
        })
      })

      describe("when the robots direction is WEST", () => {
        describe("and is in a position where it can move", () => {
          const robotLocation = { x: 3, y: 0, direction: 'WEST' }

          it("moves WEST incrementing 'y' ", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql({ x: 2, y: 0, direction: 'WEST' })
          })
        })

        describe("and is in a position where it cannot move", () => {
          const robotLocation = { x: 0, y: 4, direction: 'WEST' }
          it("does not move", () => {
            const result = app.__int__.executeCommand(robotLocation, command)
            expect(result.robotLocation).to.be.eql(robotLocation)
          })
        })
      })
    })

    describe('LEFT', () => {
      const command = 'LEFT'
      WhenTheRobotHasNotBeenPlaced((robotLocation) => {
        it('returns an error message', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result).to.be.eql({ err: 'Robot has not been placed' })
        })
      })

      WhenTheRobotIsFacing('NORTH', (robotLocation) => {
        it('returns a robot facing WEST', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'WEST' }))
        })
      })

      WhenTheRobotIsFacing('WEST', (robotLocation) => {
        it('returns a robot facing SOUTH', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'SOUTH' }))
        })
      })

      WhenTheRobotIsFacing('SOUTH', (robotLocation) => {
        it('returns a robot facing EAST', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'EAST' }))
        })
      })

      WhenTheRobotIsFacing('EAST', (robotLocation) => {
        it('returns a robot facing NORTH', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'NORTH' }))
        })
      })

    })

    describe('RIGHT', () => {
      const command = 'RIGHT'
      WhenTheRobotHasNotBeenPlaced((robotLocation) => {
        it('returns an error message', () => {

          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result).to.be.eql({ err: 'Robot has not been placed' })
        })
      })

      WhenTheRobotIsFacing('NORTH', (robotLocation) => {
        it('returns a robot facing EAST', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'EAST' }))
        })
      })

      WhenTheRobotIsFacing('EAST', (robotLocation) => {
        it('returns a robot facing SOUTH', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'SOUTH' }))
        })
      })

      WhenTheRobotIsFacing('SOUTH', (robotLocation) => {
        it('returns a robot facing WEST', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'WEST' }))
        })
      })

      WhenTheRobotIsFacing('WEST', (robotLocation) => {
        it('returns a robot facing NORTH', () => {
          const result = app.__int__.executeCommand(robotLocation, command)
          expect(result.robotLocation).to.be.eql(Object.assign({}, robotLocation, { direction: 'NORTH' }))
        })
      })
    })
  })
})

function WhenTheRobotHasNotBeenPlaced(fn) {
  describe('When the robot has not been placed', () => {
    const robotLocation = null
    fn(robotLocation)

  })
}

function WhenTheRobotIsFacing(direction, fn) {
  describe(`When the robot is facing ${direction}`, () => {
    const robotLocation = { x: 0, y: 0, direction }
    fn(robotLocation)
  })
}
