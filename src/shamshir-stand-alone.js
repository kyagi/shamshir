const { argv } = require('./yargs.js')
const { owner, repo, label, quorum, check } = argv

let mode = "live"
if (check === true) {
    mode = "dry-run"
}

const Shamshir = require("./shamshir.js")
const shamshir = new Shamshir(owner, repo, label, quorum, mode)

// TODO: fix or use top level await
shamshir.run()
