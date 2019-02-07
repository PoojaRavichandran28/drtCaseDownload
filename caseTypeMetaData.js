const cheerio = require('cheerio')
const request = require('request')

const url = 'http://drt.etribunals.gov.in/drtlive/caseenowisesearch.php'

async function getMetaData(url) {
    let page = await fetchPage(url)
    let caseType = parseCaseType(page)
    return JSON.stringify(caseType)
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) reject(err)
            resolve(body)
        })
    })
}

function parseCaseType(page) {
    let $ = cheerio.load(page)
    let caseType = []
    $('#case_type').find('option').each((i, op) => {
        let caseTypeObj = {}
        caseTypeObj.value = $(op).text().replace('-', '')
        caseTypeObj.key = caseTypeObj.value.split(' ').length === 2 ? caseTypeObj.value.split(' ')[0][0].concat(caseTypeObj.value.split(' ')[1][0]) : caseTypeObj.value
        caseTypeObj.remoteKey = $(op).attr('value')
        caseType.push(caseTypeObj)
    })
    return caseType
}

async function execute() {
    let result = await getMetaData(url)
    console.log(result)
}

execute()