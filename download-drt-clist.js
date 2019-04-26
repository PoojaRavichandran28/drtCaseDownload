const cheerio = require('cheerio')
const moment = require('moment')
const mdudrt = require('./drt.madurai.causelist.download')
const chennaidrt1 = require('./drt.chennai-1.causelist.download')
const chennaidrt2 = require('./drt.chennai-2.causelist.download')
const chennaidrt3 = require('./drt.chennai-3.causelist.download')
const {
  xrequest: http,
} = require('ca-common')

module.exports = {
  handle (jdata) {
    return new Promise(async (resolve, reject) => {
      if ((jdata.courtKey === 'madurai-drt') && jdata.data.listName) {
        const json = mdudrt.handle(jdata)
        return resolve(json)
      }
      if ((jdata.courtKey === 'chennai-drt-1') && jdata.data.listName.indexOf('Daily Causelist') > -1) {
        const json = chennaidrt1.handle(jdata)
        return resolve(json)
      }
      if ((jdata.courtKey === 'chennai-drt-2') && jdata.data.listName.indexOf('Daily Causelist') > -1) {
        const json1 = await getDcCauselist(jdata).then(async (url) => {
          if (!url) return reject(new Error(`causelist not listed for ${jdata.courtKey} on ${jdata.data.date}`))
          const json2 = await getDcCauselistData(url)
          return json2
          // return resolve(getDcCauselistData(url, true))
        })
        const json3 = await chennaidrt2.handle(jdata)
        const jsonCombo = json1.concat(json3)
        const finalJson = []
        jsonCombo.forEach((item) => {
          const existing = finalJson.filter((v, i) => {
            return v.caseNumber == item.caseNumber
          })
          if (existing.length) {
            const existingIndex = finalJson.indexOf(existing[0])
            finalJson[existingIndex].itemNo = item.itemNo
            finalJson[existingIndex].judges = finalJson[existingIndex].judges.concat(item.judges)
            finalJson[existingIndex].time = item.time
            finalJson[existingIndex].petitioners = item.petitioners
            finalJson[existingIndex].respondents = item.respondents
          } else {
            if (typeof item.judges == 'string') {
              item.judges = [item.judges]
            }
            finalJson.push(item)
          }
        })
        return resolve(finalJson)
      }
      if ((jdata.courtKey === 'chennai-drt-3') && jdata.data.listName) {
        const json = chennaidrt3.handle(jdata)
        return resolve(json)
      }
      if (jdata.data.listName === 'Entire Causelist') {
        getEntireCauselist(jdata).then(url => {
          if (!url) return reject(new Error(`causelist not listed for ${jdata.courtKey} on ${jdata.data.date}`))
          return resolve(getSearchFormData(url))
        }).catch(e => {
          return reject(e)
        })
      } else if ((jdata.data.listName === 'Daily Causelist') && (jdata.courtKey !== 'chennai-drt-2' || jdata.courtKey !== 'chennai-drt-1')) {
        getDcCauselist(jdata).then(url => {
          if (!url) return reject(new Error(`causelist not listed for ${jdata.courtKey} on ${jdata.data.date}`))
          return resolve(getDcCauselistData(url, true))
        })
      } else {
        getRcCauselist(jdata).then(url => {
          if (!url) return reject(new Error(`causelist not listed for ${jdata.courtKey} on ${jdata.data.date}`))
          return resolve(getSearchFormData(url, true))
        }).catch(e => {
          return reject(e)
        })
      }
    })
  },
}

/**
 * get entire causelist html
 * @param {*} jdata
 */
function getEntireCauselist(jdata) {
  return new Promise((resolve, reject) => {
    const url = 'http://drt.etribunals.gov.in/drtlive/order/Hcreate_causelist.php'
    const payload = {
      'c_date': moment(jdata.data.date).format('DD/MM/YYYY'),
      schemas: jdata.data.drtId.toUpperCase(),
    }
    http
      .url(url)
      .options('form', payload)
      .post()
      .then(response => {
        const url = 'http://drt.etribunals.gov.in/drtlive/order/Hgenerate_causelist_save1.php?filing_no=#filingNo&id=#id'
        return resolve(parseCauselistUrl(response.content, url))
      })
  })
}

function parseRcCauselist(html) {
  const causelistRegexPattern = new RegExp('(of|for)\\s*(\\d{1,2}\\/){2}\\d{4}', 'img')
  const urlPtrn = /.*'(.*)'.*/igm
  const $ = cheerio.load(html)
  const anchorTags = $('a').toArray()
    .filter(a => {
      if ($(a).text() && causelistRegexPattern.test($(a).text())) {
        return a
      }
    })
  if (anchorTags.length === 0) return false
  return $(anchorTags[0]).attr('href').replace(urlPtrn, '$1')
}

/**
 * get rc causelist html
 * @param {*} jdata
 */
function getRcCauselist(jdata) {
  return new Promise((resolve, reject) => {
    const url = 'http://drt.etribunals.gov.in/drtlive/order/rccauselist.php'
    const payload = {
      benchnature: jdata.data.roomList,
      'c_date': moment(jdata.data.date).format('DD/MM/YYYY'),
      courtno: jdata.data.roomId,
      schemas: jdata.data.drtId.toUpperCase(),
    }
    http
      .url(url)
      .options('form', payload)
      .post()
      .then(response => {
        const urlText = parseRcCauselist(response.content)
        return resolve(`http://drt.etribunals.gov.in/drtlive/order/rccauselist_report_save.php?no=${urlText}`)
      })
  })
}

/**
 * get rc causelist html
 * @param {*} jdata
 */
function getDcCauselist(jdata) {
  return new Promise((resolve, reject) => {
    const url = 'http://drt.etribunals.gov.in/drtlive/order/Hcreate_causelist1.php'
    const payload = {
      benchnature: jdata.data.roomList,
      'c_date': moment(jdata.data.date).format('DD/MM/YYYY'),
      courtno: jdata.data.roomId,
      schemas: jdata.data.drtId,
    }
    http
      .url(url)
      .options('form', payload)
      .post()
      .then(response => {
        const url = 'http://drt.etribunals.gov.in/drtlive/order/Hgenerate_causelist_save1.php?filing_no=#filingNo&id=#id'
        const urlText = parseCauselistUrl(response.content, url)
        return resolve(urlText)
      })
  })
}

function parseCauselistUrl(html, url) {
  const urlPtrn = /.*'(.*)','(.*)'.*/igm
  const $ = cheerio.load(html)
  const a = $('form a')
  if (!a) return false
  let urlText = $(a).attr('href')
  urlText = urlText.replace(urlPtrn, '$1,$2')
  const [filingNo, id] = urlText.split(',')
  const cauelistUrl = url.replace('#filingNo', filingNo).replace('#id', id)
  return cauelistUrl
}

function getSearchFormData(url, isRc = false) {
  return new Promise((resolve, reject) => {
    http
      .url(url, true)
      .get()
      .then(result => {
        if (result.statusCode === 200) {
          if (isRc) resolve(parseRcFormData(result.content))
          return resolve(parseFormData(result.content))
        } else {
          return reject(new Error(`${result.statusCode} received : not found received`))
        }
      })
  })
}

function getSittings() {
  const sitting = {}
  sitting.judges = []
  sitting.date = []
  sitting.room = ''
  sitting.cases = []
  sitting.date = ''
  sitting.time = ''
  return sitting
}

function sendCases(sittings) {
  const cases = [].concat.apply([], sittings.map(i => {
    const obj = Object.assign({}, i)
    delete obj.cases
    return i.cases.map(kase => Object.assign({}, kase, obj))
  }))
  return cases
}

function parseFormData(html) {
  const $ = cheerio.load(html)
  const sittings = []
  let sitting = getSittings()
  let cause = ''
  //   const itemNo = 0
  const judge1Ptrn = /^\s*HON['`’]BLE/igm
  const judge2Ptrn = /Ld\.?\s*REGISTRAR/igm
  const courtPtrn = /COURT NO\.?\s:\s*(\d{1,})/igm
  const datePtrn = /Causelist For\s*(\d{1,2}\/\d{1,2}\/\d{4}).*/igm
  let createSetting = true
  $('table tr').each((i, tr) => {
    if ($(tr).children() && ($(tr).children().length === 4 || $(tr).children().length === 5)) {
      const cases = getCase($, tr, cause)
      if (cases.length > 0) sitting.cases.push(...cases)
      createSetting = true
    } else if ($(tr).children() && $(tr).children().length === 3) {
      if ($(tr).has('u').length === 1) {
        cause = clean($(tr).text().trim())
      } else {
        const text = clean($(tr).text())
        if (judge1Ptrn.test(text) === true || judge2Ptrn.test(text) === true) {
          if (createSetting) {
            sitting = getSittings()
            sittings.push(sitting)
            createSetting = false
          }
          sitting.judges = [text]
        } else if (datePtrn.test(text)) {
          if (createSetting) {
            sitting = getSittings()
            sittings.push(sitting)
            createSetting = false
          }
          sitting.date = moment(text.replace(datePtrn, '$1'), 'DD/MM/YYYY').toDate()
        }
      }
    } else {
      const text = clean($(tr).text())
      if (courtPtrn.test(text) === true) {
        if (createSetting) {
          sitting = getSittings()
          sittings.push(sitting)
          createSetting = false
        }
        sitting.room = text.replace(courtPtrn, '$1')
      }
    }
  })
  return sendCases(sittings)
}

function parseRcFormData(html) {
  const $ = cheerio.load(html)
  const sittings = []
  let sitting = getSittings()
  let cause = ''
  //   const itemNo = 0
  const judge1Ptrn = /^\s*HON['`’]BLE/igm
  const judge2Ptrn = /^\s*Ld\.?\s*.*/igm
  const courtPtrn = /ro\s*court\s*:\s*(\d{1,})/igm
  const datePtrn = /RO Causelist For\s*(\d{1,2}\/\d{1,2}\/\d{4}).*/igm
  let createSetting = true
  $('table tr').each((i, tr) => {
    if ($(tr).children() && ($(tr).children().length === 5 || $(tr).children().length === 6)) {
      const cases = getRcCase($, tr, cause)
      if (cases.length > 0) sitting.cases.push(...cases)
      createSetting = true
    } else {
      if ($(tr).has('u').length === 1) {
        cause = clean($(tr).text().trim())
      } else {
        const text = clean($(tr).text())
        if (judge1Ptrn.test() === true || judge2Ptrn.test(text) === true) {
          if (createSetting) {
            sitting = getSittings()
            sittings.push(sitting)
            createSetting = false
          }
          sitting.judges = [text]
        } else if (datePtrn.test(text)) {
          if (createSetting) {
            sitting = getSittings()
            sittings.push(sitting)
            createSetting = false
          }
          sitting.date = moment(text.replace(datePtrn, '$1'), 'DD/MM/YYYY').toDate()
        } else if (courtPtrn.test(text) === true) {
          if (createSetting) {
            sitting = getSittings()
            sittings.push(sitting)
            createSetting = false
          }
          sitting.room = text.replace(courtPtrn, '$1')
        }
      }
    }
  })
  return sendCases(sittings)
}

const clean = (data) => {
  data = data.replace(/[\n\t\s]/igm, ' ')
  data = data.replace(/\s{2,}/, ' ')
  return data.trim()
}

const getParty = (text) => {
  text = clean(text)
  const [pet, resp] = text.split(/\s*Vs\s*/igm)
  return {
    petitioners: [pet],
    respondents: [resp],
  }
}

function getRcCase($, tr, cause) {
  const tds = $(tr).find('td')
  if (tds.length === 5 || tds.length === 6) {
    const itemNo = clean($(tds[0]).text())
    const petitioners = clean($(tds[2]).text())
    const respondents = clean($(tds[3]).text())
    const caseData = getRcCaseNumberWithCause($, tds[1])
    const pAadvocate = clean($(tds[4]).text())
    let rAadvocate
    if (tds[5]) rAadvocate = clean($(tds[5]).text())
    if (caseData.cause) cause = `For RC - ${caseData.cause}`
    if (!caseData.caseNumber) return []
    const kase = {
      caseNumber: caseData.caseNumber,
      cause,
      itemNo,
      petitioners: [petitioners],
      respondents: [respondents],
    }
    if (pAadvocate) kase.pAdvocates = [pAadvocate]
    if (rAadvocate) kase.rAdvocates = [rAadvocate]
    return [kase]
  } else return []
}

function getAdvocate(html) {
  const [padv, radv] = html.split('<hr>')
  return {
    padv: clean(padv),
    radv: clean(radv),
  }
}

function getCase($, tr, cause) {
  const tds = $(tr).find('td')
  if (tds.length === 4) {
    const itemNo = clean($(tds[0]).text())
    const caseNumbers = getCaseNumbers($(tds[1]).html())
    // const party = getParty($(tds[2]).text())
    const advocate = getAdvocate($(tds[3]).html())
    const cases = caseNumbers.map(doc => {
      const kase = {
        caseNumber: doc.caseNumber,
        cause,
        itemNo,
        // petitioners: party.petitioners,
        // respondents: party.respondents,
      }
      if (advocate.padv) kase.pAdvocates = [advocate.padv]
      if (advocate.radv) kase.rAdvocates = [advocate.radv]
      if (doc.interims.length > 0) kase.interimCases = doc.interims
      return kase
    })
    return cases
  } else return []
}

function getRcCaseNumberWithCause($, td) {
  let cnos = $(td).text()
  cnos = cnos.replace(/^\s*IN/igm, '')
  cnos = cnos.split(/\n/).filter(cno => {
    return cno.trim()
  })
  const caseData = {}
  cnos.forEach(cno => {
    cno = clean(cno)
    cno = cno.replace(/(.*\/\d+\/\d{4})(.*)/im, '$1')
    if (cno.indexOf('RC') > -1) {
      caseData.cause = cno
    } else {
      caseData.caseNumber = cno
    }
  })
  return caseData
}

function getCaseNumbers(html) {
  const caseNumbers = html.split('<br>')
  let caseNos = []
  caseNumbers.forEach(cNo => {
    cNo = clean(cNo)
    cNo = cNo.replace(/\(.*\)$/igm, '')
    cNo = cNo.replace(/^(IA)(\d{1,})\/(\d{4})/igm, '$1/$2/$3')
    cNo = cNo.trim()
    cNo = cNo.replace(/(.*\/\d+\/\d{4})(.*)/im, '$1')
    const [type] = cNo.split('/')
    if (cNo !== 'IN' && cNo) {
      if (type !== 'IA') {
        caseNos.push({
          caseNumber: cNo,
          interims: [],
        })
      } else {
        caseNos[caseNos.length - 1].interims.push({
          caseNumber: cNo,
        })
      }
      return cNo
    }
  })
  const ptr = new RegExp('^\\s*(NDN|ODN)', 'im')
  caseNos = caseNos.filter(doc => {
    const isDairyNumber = ptr.test(doc.caseNumber)
    if (!isDairyNumber) {
      return doc
    }
  })
  return caseNos
}

function getDcCauselistData(url) {
  return new Promise((resolve, reject) => {
    http
      .url(url, true)
      .get()
      .then(result => {
        if (result.statusCode === 200) {
          return resolve(parseFormData(result.content))
        } else {
          return reject(new Error(`${result.statusCode} received : not found received`))
        }
      })
  })
}
