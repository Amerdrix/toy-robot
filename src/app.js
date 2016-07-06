const RxNode = require('rx-node')

exports.run = (stream) => {
    RxNode.fromStream(stream)
      .select(buffer => buffer.toString().trim())
      .subscribe(line => console.log("echo" ,line))
}
