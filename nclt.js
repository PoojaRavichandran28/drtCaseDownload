const cheerio = require('cheerio')
const request = require('request')
const url = 'https://nclt.gov.in/pdf-cause-list?field_bench_target_id=5365&field_bench_court_target_id_entityreference_filter=5379' 

async function nclt(url) {
    let page = await fetchPage(url)
    console.log(page)
    let details = getClistDate(page)
    console.log(details)
    return details
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url,(err,res,body) => {
            if(err) reject(err)
            resolve(body)
        })
    })
}

function getClistDate(page) {
    let $ = cheerio.load(page)
    let details = []
    $('table').find('tbody').find('tr').each((rowNo,row) => {
        let col = $(row).find('td')
        let data = {
            pdfLink : $(col[4]).find('a').attr('href'),
            date : $(col[5]).text()
        }
        details.push(data)
    })
    return details
}

async function execute() {
    let result = await nclt(url)
    console.log(result)
}

execute()