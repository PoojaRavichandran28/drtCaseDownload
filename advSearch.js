const cheerio = require('cheerio')
const request = require('request')

exports.advSearch = async function (url) {
    let page = await fetchPage(url)
    let link = getLink(page)
    let casePage = []
    for (let lnk = 0; lnk < link.length; lnk++) {
        casePage.push(await fetchPage(link[lnk]))
    }
    let details = []
    for (let cp = 0; cp < casePage.length; cp++) {
        details.push(getDetails(casePage[cp]))
    }
    return details
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) reject(err)
            resolve(body)
        })
    })
}

function getLink(page) {
    let $ = cheerio.load(page)
    let endpoint = []
    if ($('a').text() === '') {
        console.log('Page does not exist')
    } else {
        $('td').find('a').each((i, col) => endpoint.push($(col).attr('href').match(/'(.*?)'/g)[0].replace(/'*/g, '')))
    }
    let link = endpoint.map(el => 'http://drt.etribunals.gov.in/drtlive/Misdetailreport.php?no=' + el)
    return link
}

function getDetails(casePage) {
    let $ = cheerio.load(casePage)
    let caseDetails = {}
    let petDetails = {}
    let resDetails = {}
    let detail = []
    $('table').each((tn, table) => {
        if (tn === 0 || tn === 3) {
            const rows = $(table).find('tr')
            rows.each((rn, row) => {
                const cols = $(row).find('td')
                if (tn === 0 && $(cols[0]).text().split('/').length === 3) {
                    caseDetails['caseNumber'] = $(cols[1]).text()
                } else if (tn === 3) {
                    if ($(row).text().includes('Petitioner Name') || $(row).text().includes('Respondent Name'))
                        detail.push($(row).text().replace(/\n/g, '').replace(/\s+/g, ' '))
                }
            })
        }
    })
    getPetitionerDetails(petDetails, detail)
    getRespondentDetails(resDetails, detail)
    caseDetails['party'] = petDetails['Petitioner Name '] + ' VS ' + resDetails['Respondent Name ']
    caseDetails['courtKey'] = 'bangalore'
    caseDetails['side'] = ''
    caseDetails['pAdvocate'] = petDetails['pAdvocate']
    caseDetails['rAdvocate'] = resDetails['rAdvocate']
    caseDetails['payload'] = {
        caseNumber : caseDetails['caseNumber'],
        side : ''
    }

    return caseDetails
}

function getPetitionerDetails(petDetails, detail) {
    let pet = detail[0].split('Pet. Advocate Name:')[0]
        .split('pet. Address:')[0]
        .replace('Additional Party(Pet.):', ',')
        .split(',')
        .map(el => el.trim())
    let petKey = pet[0].split('-')[0]
    let petValueRaw = pet.map(el => el.replace('Petitioner Name -', ''))
    let petValue = petValueRaw.slice(0, petValueRaw.length - 1)
    let petAdv = detail[0].split('Pet. Advocate Name:')[1]
        .replace('Additional Advocate(Pet.):', ',')
        .split(',')
        .map(el => el.trim())
    let petAdvKey = 'pAdvocate'
    let petAdvValue = petAdv[0] === '' ? [] : petAdv.slice(0,petAdv.length-1)
    petDetails[petKey] = petValue
    petDetails[petAdvKey] = petAdvValue
    return petDetails
}

function getRespondentDetails(resDetails, detail) {
    let res = detail[1].split('Respondent Advocate -')[0]
        .split('Res. Address:')[0]
        .replace('Additional Party(Res.):', ',')
        .split(',')
        .map(el => el.trim())
    let resKey = res[0].split('-')[0]
    let resValueRaw = res.map(el => el.replace('Respondent Name -', ''))
    let resValue = resValueRaw.slice(0, resValueRaw.length - 1)
    let resAdv = detail[1].split('Respondent Advocate -')[1]
        .replace('Additional Advocate(Res.):', ',')
        .split(',')
        .map(el => el.trim())
    let resAdvKey = 'rAdvocate'
    let resAdvValue = resAdv[0] === '' ? [] : resAdv.slice(0,resAdv.length-1)
    resDetails[resKey] = resValue
    resDetails[resAdvKey] = resAdvValue
    return resDetails
}