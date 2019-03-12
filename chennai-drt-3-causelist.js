const cheerio = require('cheerio')
const request = require('request')

const url = 'http://www.drt3chennai.tn.nic.in/CauseLists.htm'

async function getListedDates(url) {
    let page = await fetchPage(url)
    let listedDates = parseDates(page, url)
    let cliPage = []
    for (let ld = 0; ld < listedDates.length; ld++) {
        cliPage.push(await fetchPage(listedDates[ld].url))
    }
    let cliData = []
    for (let cp = 0; cp < cliPage.length; cp++) {
        cliData.push(parseCauselist(cliPage[cp]))
    }
    let cliDataUpdated = []
    for (let cd = 0; cd < cliData.length; cd++) {
        cliDataUpdated.push(combineCTypeCNum(cliData[cd]))
    }
    return cliDataUpdated
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) reject(err)
            resolve(body)
        })
    })
}

function parseDates(page, url) {
    let $ = cheerio.load(page)
    let baseUrl = url.replace(/\/CauseLists.htm/igm, '/')
    let listedDates = []
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    $('select').find('option').each((i, op) => {
        let date = new Date($(op).text())
        if (date >= today)
            listedDates.push({
                date: $(op).text(),
                url: baseUrl + $(op).val()
            })
    })
    return listedDates
}

function parseCauselist(page) {
    let $ = cheerio.load(page)
    let clist = []
    $('table').each((t, tbl) => {
        let headers = []
        let position = undefined
        $(tbl).find('tr').each((rw, row) => {
            if (rw === 0) {
                let col = $(row).find('td')
                if ($(col).length > 1) {
                    for (let cl = 0; cl < $(col).length; cl++) {
                        headers.push($(col[cl]).text())
                        position = rw
                    }
                }
            } else if (rw === 2 && headers[0] === undefined) {
                let col = $(row).find('td')
                if ($(col).length > 1) {
                    for (let cl = 0; cl < $(col).length; cl++) {
                        headers.push($(col[cl]).text())
                        position = rw
                    }
                }
            }
        })

        $(tbl).find('tr').each((rw, row) => {
            if (rw > position) {
                let obj = {}
                let col = $(row).find('td')
                if ($(col).length === 4 || $(col).length === 5) {
                    for (cl = 0; cl < headers.length; cl++) {
                        obj[headers[cl]] = $(col[cl]).text()
                    }
                    clist.push(obj)
                }
            }
        })
    })
    return clist
}

function combineCTypeCNum(cliData) {
    let pat = /case\s+ty/igm
    let cli = cliData.map(el => {
        let keys = Object.keys(el)
        if (keys.map(k => Boolean(k.match(pat)))[1] === true) {
            el.caseNumber = el[keys[1]] + '/' + el[keys[2]]
            delete el[keys[1]]
            delete el[keys[2]]
        }
        return el
    })
    return cli
}

async function execute() {
    let result = await getListedDates(url)
    console.log(result)
}

execute()