const Rx = require('rx')
exports.run = (input) => {
    return {
        "std$": Rx.Observable.empty(),
        "error$": input.select(cmd => `The command ' ${cmd} ' could not be interpreted`)
    };
}
