const cheerio = require('cheerio')
const common = require('ca-common')
const moment = require('moment')
const {
  DocumentNotFoundError,
  xrequest,
} = common

module.exports = {
  async handle (jcard) {
    // return new Promise(async (resolve, reject) => {
    const {
      listedDate,
    } = jcard.data
    let date = new Date(listedDate)
    date = moment(date).format('DD') + moment(date).format('MM') + moment(date).format('YY')
    const url = `http://www.drt2chennai.tn.nic.in/CauseLists/${date}.htm`
    const causelist = await xrequest.url(url).get()
    const html = causelist.content.toString('utf8')
    if (html) {
      if (html.includes('Record not found')) {
        throw (new DocumentNotFoundError())
      } else {
        return Parse(html)
      }
    }
    // else {
    //   return new DocumentNotFoundError()
    // }
    // }).catch(e => {
    //   console.log(e)
    // })
  },
}
function Parse (html) {
  const jlist = judgeList(html)
  const parsedlist = parseCauselist(html, jlist)
  const finalClist = buildInterims(parsedlist)
  return finalClist
}

function parseCauselist (html, jlist) {
  const $ = cheerio.load(html)
  const snoPat = /^[A-Z.\s*]+/igm
  const timePat = /(\d{1,2})(\s*)(\.*)(\s*)(\d{1,2})(\.*)(\s*)(A\.M\.|A\.M|AM|P\.M\.|P\.M|PM)/igm
  const clist = []
  $('table').each((tblno, tbl) => {
    const judge = jlist[tblno].toUpperCase().includes('HON\'BLE') ? ['HON\'BLE PRESIDING OFFICER'] : jlist[tblno].toUpperCase().includes('REGISTRAR') ? ['REGISTRAR'] : []
    const time = jlist[tblno].match(timePat)[0].toUpperCase()
    const date = moment(jlist[tblno], 'DD/MM/YYYY').toDate()
    let cause = ''
    const row = $(tbl).find('tr')
    $(row).each((rno, rw) => {
      const col = $(rw).find('td')
      if ($(col).length === 1 && cause === '') {
        cause = $(col[0]).text().trim()
      } else if ($(col).length === 1 && cause !== '') {
        cause = $(col[0]).text().trim()
      }
      if (($(col).length === 6 || $(col).length === 7) && ($(col[0]).text().trim().match(snoPat) === null)) {
        const obj = {}
        let ino
        if (tblno === 0) {
          ino = $(col[0]).find('ol').attr('start')
        } else {
          ino = $(col[0]).text().trim().replace('.', '')
        }
        obj.caseNumber = getCaseNo($(col[1]).text().trim(), $(col[2]).text().trim())
        obj.cause = cause
        obj.itemNo = ino
        obj.judges = judge
        obj.date = date
        obj.room = ''
        obj.time = time
        const pet = []
        pet.push($(col[3]).text().trim())
        obj.petitioners = pet
        const res = []
        res.push($(col[4]).text().trim())
        obj.respondents = res
        clist.push(obj)
      }
    })
  })
  return clist
}

function buildInterims (parsedlist) {
  const finalClist = []
  const intrms = []
  for (let i = 0; i < parsedlist.length; i++) {
    if (intrms.length === 1 && parsedlist[i].itemNo === intrms[0].itemNo) {
      parsedlist[i].interims = intrms[0]
      intrms.pop()
    } else if (intrms.length === 1 && parsedlist[i].itemNo !== intrms[0].itemNo) {
      parsedlist[i-1].interims = intrms[0]
      intrms.pop()
    }
    if (parsedlist[i].caseNumber.includes('I.A') || parsedlist[i].caseNumber.includes('I.A.') || parsedlist[i].caseNumber.includes('IA')) {
      intrms.push(parsedlist[i])
    } else {
      finalClist.push(parsedlist[i])
    }
  }
  return finalClist
}

function judgeList (html) {
  const $ = cheerio.load(html)
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

function getCaseNo (cType, cNum) {
  let cnoPat = /([A-Z.\s*\/]+)(\d+)(\/\d{2,4})/igm
  let cno = cType+cNum
  let cNumber = cno.match(cnoPat)[0].replace(cnoPat, '$1/$2$3')
  const [type, no, year] = cNumber.split('/')
  if (year.length === 4) {
    cno = `${type}/${no}/${year}`
  } else {
    cno = `${type}/${no}/${yearConvert(year)}`
  }
  return cno
}

function yearConvert (caseyear) {
  const currentyear = moment().format('YY')
  if (currentyear >= caseyear) {
    return '20' + caseyear
  } else {
    return '19' + caseyear
  }
}
