const { Octokit } = require("@octokit/core")
const octokit = new Octokit({auth: process.env.shamshir_pat })

// https://docs.github.com/en/rest/reference/pulls#list-pull-requests
function getPulls(owner, repo, mode) {
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
function getReviews(owner, repo, id, mode) {
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

async function hasLabel(owner, repo, issue_number, label, mode) {
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
function listLabelOfPulls(owner, repo, issue_number, label, mode) {
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
function addLabelToPull(owner, repo, issue_number, label, mode) {
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
function removeLabelFromPull(owner, repo, issue_number, label, mode) {
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

exports.getPulls = getPulls
exports.getReviews = getReviews
exports.hasLabel = hasLabel
exports.listLabelOfPulls = listLabelOfPulls
exports.addLabelToPull = addLabelToPull
exports.removeLabelFromPull = removeLabelFromPull