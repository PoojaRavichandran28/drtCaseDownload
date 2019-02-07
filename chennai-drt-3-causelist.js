const cheerio = require('cheerio')
const request = require('request')

const url = 'http://www.drt3chennai.tn.nic.in/CauseLists.htm'

async function getListedDates(url) {
    let page = await fetchPage(url)
    let dates = parseDates(page,url)
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

function parseDates(page,url) {
    let $ = cheerio.load(page)
    let baseUrl = url.replace(/\/CauseLists.htm/igm,'/')
    let listedDates = []
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    $('select').find('option').each((i,op) => {
      let date = new Date($(op).text())
      if(date >= today)
      listedDates.push({
          date : $(op).text(),
          url : baseUrl + $(op).val()
      })
    })
    return listedDates
}

async function execute() {
    let result = await getListedDates(url)
    console.log(result)
}

execute()