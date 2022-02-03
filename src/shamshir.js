// const {Octokit} = require("@octokit/core")
// let octokit = new Octokit({auth: process.env.shamshir_pat})
//
// const core = require('@actions/core')
// const github = require('@actions/github')
// const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
// if (!process.env.shamshir_pat) {
//     octokit = github.getOctokit(GITHUB_TOKEN)
// }
// const {context = {}} = github
// const {pull_request} = context.payload
//

const { Octokit } = require("@octokit/core")
const core = require('@actions/core')
const github = require('@actions/github')
const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
const { logger } = require("./winston.js")

module.exports = class Shamshir {
    constructor(owner, repo, label, quorum, mode) {
        // Switch octokit object and other properties according to the way of authentication
        if (process.env.shamshir_pat) {
            // stand-alone
            this._octokit = new Octokit({auth: process.env.shamshir_pat})
            this._owner = owner
            this._repo = repo
            this._label = label
            this._quorum = quorum
            this._mode = mode
        } else if (GITHUB_TOKEN) {
            // github-actions
            this._octokit = github.getOctokit(GITHUB_TOKEN)
            this._context = {} = github
            this._pull_request = this._context.payload
            this._owner = core.getInput('owner')
            this._repo = core.getInput('repo').split('/')[1]
            this._label = core.getInput('label')
            this._quorum = core.getInput('quorum')
            this._mode = false
        } else {
            // Neither stand-alone nor github actions
        }
    }

    async run() {
        const { owner, repo, mode, label, quorum } = this
        logger.log({level: 'info', message: 'Shamshir started.', owner: owner, repo: repo, mode: mode});
        try {
            const result = await this.getPulls()
            const ids = result.map(x => x.number)
            logger.log({ level: 'info', message: `Shamshir got pulls: ${ids}`, owner: owner, repo: repo, mode: mode })
            for (let id of ids) {
                const reviews = await this.getReviews(id)
                const states = reviews.map(x => x.state)
                if (states.filter(x => x === 'APPROVED').length >= quorum) {
                    if (await this.hasLabel(id, label)) {
                        // The pull has already both the required number of approval and the label.
                        // There is nothing left to do.
                        continue
                    }
                    if (mode === "live") {
                        await this.addLabelToPull(id, label)
                    }
                    logger.log({
                        level: 'info', message: `Shamshir added releasable label to pull/${id}.`, owner: owner, repo: repo, mode: mode })
                } else {
                    if (!await this.hasLabel(id, label)) {
                        // The pull has neither the required number of approval nor the label yet.
                        // There is nothing left to do.
                        continue
                    }
                    if (mode === "live") {
                        await this.removeLabelFromPull(id, label)
                    }
                    logger.log({ level: 'info', message: `Shamshir removed releasable label from pull/${id}.`, owner: owner, repo: repo, mode: mode})
                }
            }
        } catch (error) {
            logger.log({
                level: 'error', message: `${error}`, owner: owner, repo: repo, function: 'main', mode: mode })
        } finally {
            // TODO: fix this
            const fs = require('fs')
            fs.readFile('combined.log', 'utf-8', (err, files) => {
                if (err) { throw err; }
                core.setOutput('log', files)
            })
            logger.log({level: 'info', message: 'Shamshir finished.', owner: owner, repo: repo, mode: mode })
        }
    }

    get owner() {
        return this._owner
    }
    get repo() {
        return this._repo
    }
    get label() {
        return this._label
    }
    get quorum() {
        return this._quorum
    }
    get mode() {
        return this._mode
    }
    get octokit() {
        return this._octokit
    }

    set owner(value) {
        this._owner = value
    }
    set repo(value) {
        this._repo = value
    }
    set label(value) {
        this._label = value
    }
    set quorum(value) {
        this._quorum = value
    }
    set mode(value) {
        this._mode = value
    }

    // https://docs.github.com/en/rest/reference/pulls#list-pull-requests
    getPulls() {
        const { owner, repo, mode } = this
        return this.octokit.request("GET /repos/{owner}/{repo}/pulls", {
            owner: `${owner}`, repo: `${repo}`, page: 1
        }).then(response => {
            return response.data // Return Promise
        }).catch(response => {
            // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
            logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'getPulls', mode: mode })
            return Promise.reject(new Error(`(function: getPulls, error: ${response.status})`))
        })
    }

    // https://docs.github.com/en/rest/reference/pulls#list-reviews-for-a-pull-request
    getReviews(id) {
        const { owner, repo, mode } = this
        return this.octokit.request("GET /repos/{owner}/{repo}/pulls/{id}/reviews", {
            owner: owner, repo: repo, id: id
        }).then(response => {
            return response.data // Return Promise
        }).catch(response => {
            // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
            logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'getReviews', mode: mode })
            return Promise.reject(new Error(`(function: getReviews, error: ${response.status})`))
        })
    }

    async hasLabel(issue_number, label) {
        const { owner, repo, mode } = this
        const result = await this.listLabelOfPulls(issue_number, label)
        try {
            if (result.filter(x => x.name === label).length) {
                return true
            } else {
                return false
            }
        } catch {
            logger.log({ level: 'error', message: `${error}`, owner: owner, repo: repo, function: 'hasLabel', mode: mode })
        }
    }

    // https://docs.github.com/en/rest/reference/issues#list-labels-for-an-issue
    listLabelOfPulls(issue_number, label) {
        const { owner, repo, mode } = this
        const labels = new Array(label)
        return this.octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}/labels?pull_requests={issue_number}", {
            owner: owner, repo: repo, issue_number: issue_number, labels: labels
        }).then(response => {
            return response.data // Return Promise
        }).catch(response => {
            // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
            logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'listLabelOfPulls', mode: mode })
            return Promise.reject(new Error(`(function: listLabelOfPulls, error: ${response.status})`))
        })
    }

    // https://docs.github.com/en/rest/reference/pulls
    // Every pull request is an issue, but not every issue is a pull request. For this reason,
    // "shared" actions for both features, like manipulating assignees, labels and milestones,
    // are provided within the Issues API.
    // https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
    addLabelToPull(issue_number, label) {
        const { owner, repo, mode } = this
        const labels = new Array(label)
        return this.octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels?pull_requests={issue_number}", {
            owner: owner, repo: repo, issue_number: issue_number, labels: labels
        }).then(response => {
            return response.data // Return Promise
        }).catch(response => {
            // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
            logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'addLabelToPull', mode: mode })
            return Promise.reject(new Error(`(function: addLabelToPull, error: ${response.status})`))
        })
    }

    // https://docs.github.com/en/rest/reference/issues#remove-a-label-from-an-issue
    removeLabelFromPull(issue_number, label) {
        const { owner, repo, mode } = this
        return this.octokit.request("DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}", {
            owner: owner, repo: repo, issue_number: issue_number, name: label, pull_requests: issue_number
        }).then(response => {
            return response.data // Return Promise
        }).catch(response => {
            // Return Promise and make promise chain error so that main function can handle it within try/catch clause.
            logger.log({ level: 'error', message: `${response.status}`, owner: owner, repo: repo, function: 'removeLabelFromPull', mode: mode })
            return Promise.reject(new Error(`(function: removeLabelFromPull, error: ${response.status})`))
        })
    }
}