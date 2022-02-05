# shamshir

Attach a label to pull requests based on the number of approvals.

![shamshir](https://user-images.githubusercontent.com/90729/151774087-1d7fd050-d5fd-4b8b-9b27-eea83a5dedc9.png)

## Motivation
- Don't waste time attaching `releasable` labels to pull requests

## Design goals
- Enable to run both on a stand-alone server and on Github Actions platform
- Supposed to run under stricter assessment of pull request approvals (e.g.: Dismiss stale pull request approvals when new commits are pushed)

## Usage

### On a stand-alone server

#### Setup
```
$ npm install
```

#### Run
```
$ export shamshir_pat="<your_personal_access_token>"
$ node shamshir-stand-alone.js --owner <project_name> --repo <project_repository> --label <label_name> --quoram <the_number_of_approvals>
```
Eg:
```
$ node shamshir-stand-alone.js --owner kyagi --repo awesome-project --label releasable --quorum 2
```

#### Log
```
$ cat combined.log
{"level":"info","message":"Shamshir started.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:22"}
{"level":"info","message":"Shamshir got pulls: 2602,2598,2596,2575,2573,2557,2553,2551,2540,2539,2481,2478,2295,2281,1981,1951,1685","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:22"}
{"level":"info","message":"Shamshir added releasable label to pull/2598.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:24"}
{"level":"info","message":"Shamshir added releasable label to pull/2596.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:24"}
{"level":"info","message":"Shamshir added releasable label to pull/2575.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:25"}
{"level":"info","message":"Shamshir removed releasable label from pull/2573.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:26"}
{"level":"info","message":"Shamshir added releasable label to pull/2551.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:28"}
{"level":"info","message":"Shamshir added releasable label to pull/2540.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:29"}
{"level":"info","message":"Shamshir added releasable label to pull/2539.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:30"}
{"level":"info","message":"Shamshir added releasable label to pull/2478.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:31"}
{"level":"info","message":"Shamshir added releasable label to pull/2295.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:32"}
{"level":"info","message":"Shamshir added releasable label to pull/1951.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:34"}
{"level":"info","message":"Shamshir finished.","mode":"live","owner":"kyagi","repo":"awesome-project","service":"shamshir","timestamp":"2022-01-31 00:54:34"}
```

#### Dry-Run (with --check option)
```
$ node shamshir-stand-alone.js --owner <project_name> --repo <project_repository> --label <label_name> --quoram <the_number_of_approvals> --check
```
Eg:
```
$ node shamshir-stand-alone.js --owner kyagi --repo awesome-project --label releasable --quorum 2 --check
```

#### Options
```
  -o, --owner    github owner       
  -r, --repo     github repository   
  -l, --label    github label        
  -q, --quorum   number of approval
  -c, --check    check mode: will not make any actions  
      --version  Show version number
      --help     Show help          
```
### On Github Actions
#### Setup
Place shamshir.yml in your .github/workflows directory. You can choose events to trigger, label and quorum.

shamshir.yml
```
name: ShamshirLabeling
# *** You can choose events to trigger. ***
on:
  pull_request_review:
    types: [submitted, edited, dismissed]
  pull_request:
    types: [edited, labeld, unlabeled]
  schedule:
    - cron: '0,30 0-10 * * 1-5'

jobs:
  Labeling:
    runs-on: ubuntu-latest
    steps:
      - run: echo "🌙 Shamshir was automatically triggered by a ${{ github.event_name }} event."
      - uses: actions/checkout@v2
      - run: npm install
      - id: shamshir-run
        uses: kyagi/shamshir@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          owner: ${{ github.repository_owner }}
          repo:  ${{ github.repository }}
# *** You can choose a label. ***
          label: 'releasable'
# *** You can choose a quorum. ***
          quorum: '2'
      - run: echo "${{ steps.shamshir-run.outputs.log }}"
      - run: echo "🌙 Shamshir's status is ${{ job.status }}."
```
