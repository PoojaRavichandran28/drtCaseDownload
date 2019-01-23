const cheerio = require('cheerio')
const request = require('request')

const options = {
    url: 'http://drt.etribunals.gov.in/drtlive/order/upload_order_detail.php',
    method: 'POST',
    form: {
        search_type: 1,
        case_type1: 1,
        case_type: 1,
        case_no: 120,
        case_year: 2017,
    }
}


exports.getDailyOrder = async function() {
    let page = await fetchPage()
    let dailyOrder = parseDailyOrder(page)
    return dailyOrder
}

function fetchPage() {
    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
            if (err) reject(err)
            resolve(body)
        })
    })
}

function parseDailyOrder(page) {
    let $ = cheerio.load(page)
    let dailyOrder = []
    $('table#datatable').find('tbody').each((i, tbody) => {
        if (i !== 0) {
            let rows = $(tbody).find('tr')
            rows.each((j, row) => {
                let cols = $(row).find('td')
                let dOrder = {}
                let [dd,mm,yyyy] = $(cols[4]).text().split('/')
                let date = new Date(yyyy,mm,dd)
                let isoDate = date.toISOString()
                dOrder['Date of Order'] = isoDate
                dOrder['DO File Link'] = 'http://drt.etribunals.gov.in/drtlive/order/' + $(cols[6]).find('a').attr('href')
                dailyOrder.push(dOrder)
            })
        }
    })
    return dailyOrder
}

