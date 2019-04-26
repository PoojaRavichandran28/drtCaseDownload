const cheerio = require('cheerio')
const request = require('request')
const moment = require('moment')

const url = 'http://www.drt2chennai.tn.nic.in/CauseLists.htm'

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
    return cliData
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
    let jlist = judgeList($)
    let snoPat = /^[A-Z.\s*]+/igm
    let timePat = /(\d{1,2})(\s*)(\.*)(\s*)(\d{1,2})(\.*)(\s*)(A\.M\.|A\.M|AM|P\.M\.|P\.M|PM)/igm
    let clist = []
    $('table').each((tblno, tbl) => {
        let judge = jlist[tblno].toUpperCase().includes("HON'BLE") ? ["HON'BLE PRESIDING OFFICER"] : jlist[tblno].toUpperCase().includes("REGISTRAR") ? ["REGISTRAR"] : []
        let time = jlist[tblno].match(timePat)[0].toUpperCase()
        let date = moment(jlist[tblno], 'DD/MM/YYYY').toDate()
        let cause = ''
        let row = $(tbl).find('tr')
        $(row).each((rno, rw) => {
            let col = $(rw).find('td')
            if ($(col).length === 1 && cause === '') {
                cause = $(col[0]).text().trim()
            } else if ($(col).length === 1 && cause !== '') {
                cause = $(col[0]).text().trim()
            }
            if (($(col).length === 6 || $(col).length === 7) && ($(col[0]).text().trim().match(snoPat) === null)) {
                let obj = {}
                let ino
                if (tblno === 0) {
                    ino = $(col[0]).find('ol').attr('start')
                } else {
                    ino = $(col[0]).text().trim().replace('.', '')
                }
                obj['judge'] = judge
                obj['time'] = time
                obj['date'] = date
                obj['itemNo'] = ino
                obj['caseNumber'] = getCaseNo($(col[1]).text().trim(), $(col[2]).text().trim())
                let pet = []
                pet.push($(col[3]).text().trim())
                obj['petitioners'] = pet
                let res = []
                res.push($(col[4]).text().trim())
                obj['respondents'] = res
                obj['cause'] = cause
                clist.push(obj)
            }
        })
    })
    return clist
}

function getCaseNo(cType, cNum) {
    [no, year] = cNum.split('/')
    let cno
    if (year.length === 4) {
        cno = `${cType}/${no}/${year}`
    } else {
        cno = `${cType}/${no}/${yearConvert(year)}`
    }
    return cno
}

function yearConvert(caseyear) {
    const currentyear = moment().format('YY')
    if (currentyear >= caseyear) {
        return '20' + caseyear
    } else {
        return '19' + caseyear
    }
}

function judgeList($) {
    const jlist = []
    const jcontent = []
    $('p').each((no, namelist) => {
        jcontent.push($(namelist).text())
    })
    jcontent.forEach(judgename => {
        if ((judgename.toUpperCase().indexOf("HON'BLE") > -1) || (judgename.toUpperCase().indexOf('REGISTRAR COURT') > -1) || (judgename.toLowerCase().indexOf('transferred to the') > -1) || (judgename.toLowerCase().indexOf('re-posted') > -1) || (judgename.toLowerCase().indexOf('next hearing') > -1)) {
            jlist.push(judgename)
        }
    })
    return jlist
}


async function execute() {
    let result = await getListedDates(url)
    console.log(result)
}

execute()