const { getPulls, getReviews, hasLabel, listLabelOfPulls,
    addLabelToPull, removeLabelFromPull} = require("./shamshir.js")

const { argv } = require('./yargs.js')
const { owner, repo, label, quorum, check } = argv

const { logger } = require("./winston.js")

let mode = "live"
if (check === true) {
    mode = "dry-run"
}

mainStandAlone(owner, repo, label, quorum, mode)

async function mainStandAlone(owner, repo, label, quorum, mode) {
    logger.log({ level: 'info', message: 'Shamshir started.', owner: owner, repo: repo, mode: mode });

    try {
        const result = await getPulls(owner, repo, mode)
        const ids = result.map(x => x.number)
        logger.log({ level: 'info', message: `Shamshir got pulls: ${ids}`, owner: owner, repo: repo, mode: mode });
        for (let id of ids) {
            const reviews = await getReviews(owner, repo, id)
            const states = reviews.map(x => x.state)
            if (states.filter(x => x === 'APPROVED').length >= quorum) {
                if (await hasLabel(owner, repo, id, label, mode)) {
                    // The pull has already both the required number of approval and the label.
                    // There is nothing left to do.
                    continue
                }
                if (mode === "live") {
                    await addLabelToPull(owner, repo, id, label, mode)
                }
                logger.log({ level: 'info', message: `Shamshir added releasable label to pull/${id}.`, owner: owner, repo: repo, mode: mode });
            } else {
                if (! await hasLabel(owner, repo, id, label, mode)) {
                    // The pull has neither the required number of approval nor the label yet.
                    // There is nothing left to do.
                    continue
                }
                if (mode === "live") {
                    await removeLabelFromPull(owner, repo, id, label, mode)
                }
                logger.log({ level: 'info', message: `Shamshir removed releasable label from pull/${id}.`, owner: owner, repo: repo, mode: mode });
            }
        }
    } catch (error) {
        logger.log({ level: 'error', message: `${error}`, owner: owner, repo: repo, function: 'main', mode: mode });
    } finally {
        logger.log({ level: 'info', message: 'Shamshir finished.', owner: owner, repo: repo, mode: mode });
    }
}