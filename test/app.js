const expect = require('chai').expect
const Rx = require('rx')
const app = require('../src/app')


describe('app.js', () => {
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
})
