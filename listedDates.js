const cheerio = require('cheerio')
const request = require('request')

const url = 'http://drtcbe.tn.nic.in/po_court.htm'

async function getListedDates(url) {
    let page = await fetchPage(url)
    let dates = parseDates(page)
    return dates
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) reject(err)
            resolve(body)
        })
    })
}

function parseDates(page) {
    let $ = cheerio.load(page)
    let listedDates = []
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    $($('select')[0]).find('option').each((i,op) => {
      let rawDate = $(op).text().replace(',','').trim()
      let [dd,mm,yyyy] = rawDate.split(' ')
      let newdd = dd.replace(/st|th|rd|nd/igm,'')
      let date = new Date(`${newdd} ${mm} ${yyyy}`)
      if(date >= today)
      listedDates.push(date)
    })
    return listedDates
}

async function execute() {
    let result = await getListedDates(url)
    console.log(result)
}

execute()