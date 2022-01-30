const { Octokit } = require("@octokit/core")
const octokit = new Octokit({auth: process.env.rotulus_pat })

const { logger } = require('./winston.js')
const { argv } = require('./yargs.js')
const { owner, repo, label, quorum, check } = argv

let mode = "live"
if (check == true) {
    mode = "dry-run"
}

main(owner, repo)

async function main(owner, repo) {
    logger.log({ level: 'info', message: 'Rotulus started.', owner: owner, repo: repo, mode: mode });

    try {
        const result = await getPulls(owner, repo)
        const ids = result.map(x => x.number)
        logger.log({ level: 'info', message: `Rotulus got pulls: ${ids}`, owner: owner, repo: repo, mode: mode });
        for (let id of ids) {
            const reviews = await getReviews(owner, repo, id)
            const states = reviews.map(x => x.state)
            if (states.filter(x => x === 'APPROVED').length >= quorum) {
                if (await hasLabel(owner, repo, id, label)) {
                    // The pull has already both the required number of approval and the label.
                    // There is nothing left to do.
                    continue
                }
                if (mode === "live") {
                    await addLabelToPull(owner, repo, id, label)
                }
                logger.log({ level: 'info', message: `Rotulus added releasable label to pull/${id}.`, owner: owner, repo: repo, mode: mode });
            } else {
                if (! await hasLabel(owner, repo, id, label)) {
                    // The pull has neither the required number of approval nor the label yet.
                    // There is nothing left to do.
                    continue
                }
                if (mode === "live") {
                    await removeLabelFromPull(owner, repo, id, label)
                }
                logger.log({ level: 'info', message: `Rotulus removed releasable label from pull/${id}.`, owner: owner, repo: repo, mode: mode });
            }
        }
    } catch (error) {
        logger.log({ level: 'error', message: `${error}`, owner: owner, repo: repo, function: 'main', mode: mode });
    } finally {
        logger.log({ level: 'info', message: 'Rotulus finished.', owner: owner, repo: repo, mode: mode });
    }
}

// https://docs.github.com/en/rest/reference/pulls#list-pull-requests
function getPulls(owner, repo) {
    return octokit.request("GET /repos/{owner}/{repo}/pulls", {
        owner: `${owner}`, repo: `${repo}`, page: 1
    }).then(response => {
        return response.data // Return Promise
    }).catch(response => {
        // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
        logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'getPulls', mode: mode });
        return Promise.reject(new Error(`(function: getPulls, error: ${response.status})`))
    })
}

// https://docs.github.com/en/rest/reference/pulls#list-reviews-for-a-pull-request
function getReviews(owner, repo, id) {
    return octokit.request("GET /repos/{owner}/{repo}/pulls/{id}/reviews", {
        owner: owner, repo: repo, id: id
    }).then(response => {
        return response.data // Return Promise
    }).catch(response => {
        // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
        logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'getReviews', mode: mode });
        return Promise.reject(new Error(`(function: getReviews, error: ${response.status})`))
    })
}

async function hasLabel(owner, repo, issue_number, label) {
    const result = await listLabelOfPulls(owner, repo, issue_number, label)
    try {
        if (result.filter(x => x.name === label).length) {
            return true
        } else {
            return false
        }
    } catch {
        logger.log({ level: 'error', message: `${error}`, owner: owner, repo: repo, function: 'hasLabel', mode: mode });
    }
}

// https://docs.github.com/en/rest/reference/issues#list-labels-for-an-issue
function listLabelOfPulls(owner, repo, issue_number, label) {
    const labels = new Array(label)
    return octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}/labels?pull_requests={issue_number}", {
        owner: owner, repo: repo, issue_number: issue_number, labels: labels
    }).then(response => {
        return response.data // Return Promise
    }).catch(response => {
        // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
        logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'listLabelOfPulls', mode: mode });
        return Promise.reject(new Error(`(function: hasLabel, error: ${response.status})`))
    })
}

// https://docs.github.com/en/rest/reference/pulls
// Every pull request is an issue, but not every issue is a pull request. For this reason,
// "shared" actions for both features, like manipulating assignees, labels and milestones,
// are provided within the Issues API.

// https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
function addLabelToPull(owner, repo, issue_number, label) {
    const labels = new Array(label)
    return octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels?pull_requests={issue_number}", {
       owner: owner, repo: repo, issue_number: issue_number, labels: labels
    }).then(response => {
        return response.data // Return Promise
    }).catch(response => {
        // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
        logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'addLabelToPull', mode: mode });
        return Promise.reject(new Error(`(function: addLabelsToPull, error: ${response.status})`))
    })
}

// https://docs.github.com/en/rest/reference/issues#remove-a-label-from-an-issue
function removeLabelFromPull(owner, repo, issue_number, label) {
    return octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
        owner: owner, repo: repo, issue_number: issue_number, name: label, pull_requests: issue_number
    }).then(response => {
        return response.data // Return Promise
    }).catch(response => {
        // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
        logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'removeLabelFromPull', mode: mode });
        return Promise.reject(new Error(`(function: removeLabelFromPull, error: ${response.status})`))
    })
}
