const argv = require('yargs/yargs')(process.argv.slice(2))
    .option('owner', {
        alias: 'o',
        type: 'string',
        describe: 'github owner',
        demand: true,
    })
    .option('repo', {
        alias: 'r',
        type: 'string',
        describe: 'github repository',
        demand: true
    })
    .option('label', {
        alias: 'l',
        type: 'string',
        describe: 'github label',
        demand: true
    })
    .option('quorum', {
        alias: 'q',
        type: 'string',
        describe: 'number of approval',
        demand: true
    })
    .option('check', {
        alias: 'c',
        type: 'boolean',
        describe: 'check mode: will not make any actions',
    })
    .demandOption(['owner', 'repo', 'label', 'quorum'], 'Please specify these arguments')
    .help().argv

exports.argv = argv