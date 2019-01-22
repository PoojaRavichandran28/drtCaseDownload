const cheerio = require('cheerio')
const request = require('request')

const url = 'http://drt.etribunals.gov.in/drtlive/caseenowisesearch.php'

async function getCaseType(url) {
    let page = await fetchPage(url)
    let caseType = parseCaseType(page)
    return caseType
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url,(err,res,body) => {
            if(err) reject(err)
            resolve(body)
        })
    })
}

function parseCaseType(page) {
    let $ = cheerio.load(page)
    let caseType = []
    $('#case_type').find('option').each((i,op) => {
        let caseTypeObj = {}
        caseTypeObj.key = $(op).text().replace('-','')
        caseTypeObj.value = caseTypeObj.key.split(' ').length === 2 ? caseTypeObj.key.split(' ')[0][0].concat(caseTypeObj.key.split(' ')[1][0]) : caseTypeObj.key
        caseTypeObj.remoteKey = $(op).attr('value')
        caseType.push(caseTypeObj)
    })
    return JSON.stringify(caseType)
}

async function execute() {
    let result = await getCaseType(url)
    console.log(result)
}

execute()