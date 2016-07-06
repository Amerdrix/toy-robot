const expect = require('chai').expect
const Rx = require('rx')
const app = require('../src/app')


describe('app.js', () => {
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

      const place = 'PLACE 1,1 NORTH'
      const report = 'REPORT'

      const input$ = new Rx.Observable.from([place, report])

      it('the status of the robot is reported', (done) => {
        app.run(input$).std$.first().subscribe(output => {
          expect(output).to.eql('1,1 NORTH')
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
  })

  describe("#executeCommand", () => {
    describe("when the command is jibberish", () => {
        const jibberish = 'asoeuhsaoteu'

        it("returns the robotLocation unchanged", () => {
            const robotLocation = {}
            const result = app.__int__.executeCommand(robotLocation, jibberish)
            expect(result.robotLocation).to.be.equal(robotLocation)
        })
    })

    describe("PLACE commands", () => {
      describe("when the place command is valid", () => {
        const command = 'PLACE 1,2 NORTH'

        it("returns the robotLocation as per the command ", () => {
            const robotLocation = {}

            const result = app.__int__.executeCommand(robotLocation, command)

            expect(result.robotLocation).to.be.eql({x: 1, y: 2, direction: "NORTH"})
        })
      })

      describe("when the place command has mixed case", () => {
        const command = 'PlaCe 4,1 noRTh'

        it("returns the robotLocation as per the command ", () => {
            const robotLocation = {}

            const result = app.__int__.executeCommand(robotLocation, command)

            expect(result.robotLocation).to.be.eql({x: 4, y: 1, direction: "NORTH"})
        })
      })
    })
  })
})
