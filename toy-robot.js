const colors = require('colors/safe')
const RxNode = require('rx-node')

const app = require('./src/app')

const inputLine$ = RxNode
    .fromStream(process.stdin)
    .select(buffer => buffer.toString().trim())

const streams = app.run(inputLine$)

streams.std$.subscribe(output => console.log(output))
streams.error$.subscribe(err => console.error(colors.red(err)))
