const cheerio = require('cheerio')
const request = require('request')

const url = 'http://drt.etribunals.gov.in/drtlive/caseenowisesearch.php'

async function getDrtType(url) {
    let page = await fetchPage(url)
    let drtType = parseDrtType(page)
    return drtType
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url,(err,res,body) => {
            if(err) reject(err)
            resolve(body)
        })
    })
}

function parseDrtType(page) {
    let $ = cheerio.load(page)
    let drtType = []
    $('#schemaname').find('option').each((i,op) => {
        let drtObj = {}
        drtObj.drt = $(op).text()
        drtObj.value = $(op).attr('value')
        drtType.push(drtObj)
    })
   return drtType
}

async function execute() {
    let result = await getDrtType(url)
    console.log(result)
}

execute()