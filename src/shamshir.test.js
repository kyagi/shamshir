const Shamshir = require("./shamshir.js")

const owner = 'kyagi'
const repo = 'awesome-project'
const label = 'releasable'
const quorum = '1'
const mode  = 'dry-run'

const shamshir = new Shamshir(owner, repo, label, quorum, mode)

beforeAll(() => {
  if (! process.env.shamshir_pat) {
    console.log('Before running test, you should set environment variable $shamshir_pat.')
    throw new Error('Authentication Error')
  }
})

test('credential should be passed via environment variable', () => {
  expect(process.env.shamshir_pat).toBeDefined()
})

test('instance should be created with required properties', () => {
  expect(shamshir.owner).toBe(owner)
  expect(shamshir.repo).toBe(repo)
  expect(shamshir.label).toBe(label)
  expect(shamshir.quorum).toBe(quorum)
  expect(shamshir.mode).toBe(mode)
})
