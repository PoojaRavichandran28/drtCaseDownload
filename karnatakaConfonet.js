// const cheerio = require('cheerio')
// const request = require('request')
// const options = {
//     url: 'https://kscdrc.kar.nic.in/asp/query_case_no.asp',
//     form: {
//         cbocasetype: 'Appeal',
//         text1: 123,
//         text2: 2019,
//     }
// }
// async function caseNoSearch() {
//     let page = fetchPage()
    
// }

// async function fetchPage() {
//     return new Promise((resolve, reject) => {
//         request.post(options, (err, res, body) => {
//             if (err) reject(err)
//             resolve(body)
//         })
//     })
// }

// async function execute() {
//     let result = await caseNoSearch()
//     console.log(result)
// }

// execute()

const {JSDOM} = require('jsdom')
const caseDetailUrl = 'http://cms.nic.in/ncdrcusersWeb/courtroommodule.do'
const multiSearch = require('./confonet.multisearch.case.download')
const {
  DocumentNotFoundError,
  RemoteServerError,
  ParserError,
  xrequest,
} = require('ca-common')
const url = 'https://kscdrc.kar.nic.in/asp/query_case_no.asp'
let historyUrl = 'https://kscdrc.kar.nic.in/asp/case_history.asp?case_type=#type&case_no=#number&case_year=#year'

function handle (jdata) {
  return new Promise((resolve, reject) => {
    caseSearch(jdata).then(resp => {
      const kase = parse(resp.content)
      caseHistorySearch(jdata).then(historyRep => {
        return parseHistory(historyRep.content, kase)
      }).catch(() => resolve(kase))
    }).catch((e) => {
      reject(new RemoteServerError(e))
    })
  })
}

function caseSearch (jdata) {
  const [cType, cNo, cYear] = jdata.caseNumber.split('/')
  const payload = {
    cbocasetype: cType,
    text1: cNo,
    text2: cYear,
  }
  return xrequest.url(url, true).form(payload).post()
}

function caseHistorySearch (jdata) {
  const [cType, cNo, cYear] = jdata.caseNumber.split('/')
  historyUrl = historyUrl.replace('#type', cType).replace('#number', cNo).replace('#year', cYear)
  return xrequest.url(historyUrl, true).get()
}

function parseHistory (html, kase) {
  try {
    html = JSDOM.fragment(html)
    let tables = html.querySelectorAll('table')
    tables = Array.prototype.slice.call(tables, 0)
    for (let i = 0; i < tables.length; i += 1) {
      const trs = tables[i].querySelectorAll('tr')
      if (trs[0].children.length === 2) kase = getPartyDetail(trs, kase)
      else if (trs[0].children.length === 4) kase = getCaseProceedings(trs, kase)
    }
    console.log(kase)
    return kase
  } catch (e) {
    throw new Error(ParserError(e))
  }
}

function getPartyDetail (trs, kase) {
  for (let i = 0; i < trs.length; i += 1) {
    const tds = trs[i].querySelectorAll('td')
    const key = formatedText(tds[0].textContent)
    const value = tds[1].children && tds[1].children.length ? tds[1].children[0].value : tds[1].textContent
    if (key === 'Parties') {
      const [petitioners, respondents] = value.split('V/S')
      kase.petitioners = [petitioners]
      kase.respondents = [respondents]
    }
    if (key === 'Advocate/s') {
      const [pAdvocates, rAdvocates] = value.split('V/S')
      kase.pAdvocates = [pAdvocates]
      kase.rAdvocates = [rAdvocates]
    }
    kase[key] = value
  }
  return kase
}

function getCaseProceedings(trs, kase) {
  if (trs[0].textContent.indexOf('Posted') > -1) {
    kase.caseProceedings = []
    for (let i = 1; i < trs.length; i += 1) {
      const tds = trs[i].querySelectorAll('td')
      kase.caseProceedings.push({
        'date': tds[1].children && tds[1].children.length ? tds[1].children[0].value : tds[1].textContent,
        'purpose': tds[0].children && tds[0].children.length ? tds[0].children[0].value : tds[0].textContent,
        'status': tds[2].children && tds[2].children.length ? tds[2].children[0].value : tds[2].textContent,
        'order': tds[3].children && tds[3].children.length ? tds[3].children[0].value : tds[3].textContent,
      })
    }
  }
  return kase
}

function parse (html) {
  try {
    html = JSDOM.fragment(html)
    let tables = html.querySelectorAll('table')
    tables = Array.prototype.slice.call(tables, 1)
    if (tables.length === 1 && tables[0].textContent.indexOf('No such case registered') > -1) {
      throw new DocumentNotFoundError()
    }
    tables.pop()
    let kase = {}
    for (let i = 0; i < tables.length; i += 1) {
      const trs = tables[i].querySelectorAll('tr')
      if (trs[0].children.length === 2) kase = getBasicDetail(trs, kase)
      else if (trs[0].children.length === 4) kase = getDeposit(trs, kase)
    }
    return kase
  } catch (e) {
    throw new Error(ParserError(e))
  }
}

function getBasicDetail (trs, kase) {
  let previousKey = ''
  for (let i = 0; i < trs.length; i += 1) {
    const tds = trs[i].querySelectorAll('td')
    let key = formatedText(tds[0].textContent)
    const value = tds[1].children && tds[1].children.length ? tds[1].children[0].value : tds[1].textContent
    if (key) {
      previousKey = key
      kase[key] = value
    } else {
      key = previousKey
      if (kase[key]) {
        if (typeof kase[key] === 'string') {
          const valueStr = kase[key]
          kase[key] = []
          kase[key].push(valueStr)
        }
        kase[key].push(value)
      } else {
        kase[key] = value
      }
    }
  }
  return kase
}

function getDeposit (trs, kase) {
  if (trs[0].textContent.indexOf('Deposited') > -1) {
    kase.deposits = []
    for (let i = 1; i < trs.length; i += 1) {
      const tds = trs[i].querySelectorAll('td')
      kase.deposits.push({
        'amount': tds[2].children && tds[2].children.length ? tds[2].children[0].value : tds[2].textContent,
        'date': tds[1].children && tds[1].children.length ? tds[1].children[0].value : tds[1].textContent,
        'depositedBy': tds[0].children && tds[0].children.length ? tds[0].children[0].value : tds[0].textContent,
        'details': tds[3].children && tds[3].children.length ? tds[3].children[0].value : tds[3].textContent,
      })
    }
  }
  return kase
}

function formatedText (text) {
  return text.replace(/[\n\t\s]/igm, ' ').trim()
}

handle({caseNumber: 'Appeal/235/2017'})