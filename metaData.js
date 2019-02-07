const cheerio = require('cheerio')
const request = require('request')

const url = 'http://drt.etribunals.gov.in/drtlive/caseenowisesearch.php'

async function getMetaData(url) {
    let page = await fetchPage(url)
    let drtType = parseDrtType(page)
    let caseType = parseCaseType(page)
    let advType = parseAdvType(page)
    let partyType = parsePartyType(page)
    return {
        drtType,
        caseType,
        advType,
        partyType
    }
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) reject(err)
            resolve(body)
        })
    })
}

function parseDrtType(page) {
    let $ = cheerio.load(page)
    let drtType = []
    $('#schemaname').find('option').each((i, op) => {
        let drtObj = {}
        drtObj.drt = $(op).text()
        drtObj.value = $(op).attr('value')
        drtType.push(drtObj)
    })
    return drtType
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

function parseAdvType(page) {
    let $ = cheerio.load(page)
    let advType = []
    $('#AdvocateType').find('option').each((i, op) => {
        if (i !== 0) {
            let advTypeObj = {}
            advTypeObj.AdvocateType = $(op).text()
            advTypeObj.value = $(op).attr('value')
            advType.push(advTypeObj)
        }
    })
    return advType
}

function parsePartyType(page) {
    let $ = cheerio.load(page)
    let partyType = []
    $('#partyType').find('option').each((i, op) => {
        if (i !== 0) {
            let partyTypeObj = {}
            partyTypeObj.partyType = $(op).text()
            partyTypeObj.value = $(op).attr('value')
            partyType.push(partyTypeObj)
        }
    })
    return partyType
}

async function execute() {
    let result = await getMetaData(url)
    console.log(JSON.stringify(result))
}

execute()