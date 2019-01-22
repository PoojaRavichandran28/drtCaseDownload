const cheerio = require('cheerio')
const request = require('request')
const download = require('download-pdf')

const options = {
    url: 'http://drt.etribunals.gov.in/drtlive/order/upload_order_detail.php',
    method: 'POST',
    form: {
        search_type: 1,
        case_type1: 1,
        case_type: 1,
        case_no: 120,
        case_year: 2015,
    }
}

async function getDailyOrders() {
    let page = await fetchPage()
    let pdfEndpoint = parsePdfEndpoint(page)
    let pdfLink = buildPdfLink(pdfEndpoint)
    return pdfLink
}

function fetchPage() {
    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
            if(err) reject(err)
            resolve(body)
        })
    })
}

function parsePdfEndpoint(page) {
    let $ = cheerio.load(page)
    let pdfEndpoint = []
    $('table#datatable').find('a').each((i,a) => {
      pdfEndpoint.push($(a).attr('href'))
    })
    return pdfEndpoint
}

function buildPdfLink(pdfEndpoint) {
    let pdfLink = pdfEndpoint.map((el) => 'http://drt.etribunals.gov.in/drtlive/order/'+el)
    return pdfLink
}

async function execute() {
    let result = await getDailyOrders()
    console.log(result)
}

execute()
