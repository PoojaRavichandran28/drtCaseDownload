const cheerio = require('cheerio')
const request = require('request')
let pageNo = 1
let flag = true

async function aftPartySerach() {
    const partyDetails = []
    while (flag) {
        console.log(pageNo)
        let page = await fetchPage('ashok')
        let details = await getPartyDetails(page)
        partyDetails.push(...details)
    }
    return partyDetails

}

function fetchPage (partyName) {
    return new Promise((resolve, reject) => {
      request.post({
        url: 'http://aftdelhi.nic.in/aft/index.php?option=com_casetracking&view=casestatus&layout=title&Itemid=20',
        form: {
          title: partyName,
          page: pageNo
        }
      }, function (err, res, body) {
        if (err) reject(err)
        resolve(body)
      })
    })
  }

async function getPartyDetails(page) {
    const $ = cheerio.load(page)
    const pDetails = []
    const table = $($('table')[1])
    const row = $(table).find('tr')
    if ($(row).length < 23) {
        flag = false
    } else {
        pageNo++
    }
    $(row).each((rno, rw) => {
        if (rno !== 0 && rno !== 1 && rno !== $(row).length - 1) {
            const col = $(rw).find('td')
            const obj = {}
            getCaseNo($(col[0]).text(), obj)
            getPetRes($(col[1]).text(), obj)
            obj.party = obj.petitioner + ' Vs. ' + obj.respondent
            pDetails.push(obj)
        }
    })
    return pDetails
}

function getCaseNo(cno, obj) {
    const cnoPat = /([A-Z.\s*\/]+)(\d+)(\/\d{2,4})/igm
    const cNum = cno.replace(/\s*/g, '').match(cnoPat)[0].replace(cnoPat, '$1/$2$3')
    obj.caseNumber = cNum
    return obj
}

function getPetRes(party, obj) {
    if (party.split('v/s').length === 2) {
        let [pet, res] = party.split('v/s')
        obj.petitioner = pet.replace(/\s+/g, ' ').replace(/\(Petitioner\)/g, '').trim()
        obj.respondent = res.replace(/\s+/g, ' ').replace(/\(Respondent\)/g, '').trim()
        return obj
    } else if (party.split('v/s').length === 1) {
        if (party.split('v/s')[0].includes('(Petitioner)')) {
            obj.petitioner = party.split('v/s')[0].replace(/\s+/g, ' ').replace(/\(Petitioner\)/g, '').trim()
        } else if (party.split('v/s')[0].includes('(Respondent)')) {
            obj.respondent = party.split('v/s')[0].replace(/\s+/g, ' ').replace(/\(Respondent\)/g, '').trim()
        }
        return obj
    }
}

async function execute() {
    let result = await aftPartySerach()
    console.log(result)
}

execute()