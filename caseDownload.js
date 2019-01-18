const cheerio = require('cheerio')
const request = require('request')

const url = 'http://drt.etribunals.gov.in/drtlive/partyDetail.php?caseNo=120&caseType=7&year=2015&sc=delhi&id=casetypewise'

async function getCaseDetails(url) {
    let page = await fetchPage(url)
    let link = getLink(page)
    let casePage = await fetchPage(link)
    let details = getDetails(casePage)
    return details
    
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        request(url,(err,res,body) => {
            if(err) reject(err)
            resolve(body)
        })
    })
}

function getLink(page) {
     let $ = cheerio.load(page)
     let endPoint
     if($('a').text()===''){
         console.log('Page does not exist')
     }
     else {
         endPoint = $('a').attr().href.match(/'(.*?)'/g).map(el => el.replace(/'*/g,''))[0]
    }
     return 'http://drt.etribunals.gov.in/drtlive/Misdetailreport.php?no='+endPoint
}

function getDetails(casePage) {
    let $ = cheerio.load(casePage)
    let caseDetails = {}
    let details = []
    $('table').each((i,table) => {
            if (i === 0 || i === 3) {
                const rows  = $(table).find('tr')
                rows.each((j, row) => {
                    const cols = $(row).find('td')
                    if (i === 0) {
                        let key = $(cols[0]).text()
                        let value = $(cols[1]).text()
                        if (value.trim())
                        caseDetails[key] = value
                    } else if (i === 3) {
                        if($(row).text().includes('Petitioner Name') || $(row).text().includes('Respondent Name'))
                        details.push($(row).text().replace(/\n/g,'').replace(/\s+/g,' '))
                    }
                })
            }
        })
        getPetitionerDetails(caseDetails,details)
        getRespondentDetails(caseDetails,details)
        caseDetails['party'] = caseDetails['Petitioner Name ']+' VS '+caseDetails['Respondent Name ']
        
    return JSON.stringify(caseDetails)
}

function getPetitionerDetails(caseDetails, details) {
    let pet = details[0].split('pet. Address:')[0]
                  .replace('Additional Party(Pet.):',',')
                  .split(',')
                  .map(el => el.trim())
        let petKey = pet[0].split('-')[0]
        let petValueRaw = pet.map(el => el.replace('Petitioner Name -',''))
        let petValue = petValueRaw.slice(0,petValueRaw.length-1)
        caseDetails[petKey] = petValue
        return caseDetails
}

function getRespondentDetails(caseDetails, details) {
    let res = details[1].split('Res. Address:')[0]
                  .replace('Additional Party(Res.):',',')
                  .split(',')
                  .map(el => el.trim())
        let resKey = res[0].split('-')[0]
        let resValueRaw = res.map(el => el.replace('Respondent Name -',''))
        let resValue = resValueRaw.slice(0,resValueRaw.length-1)
        caseDetails[resKey] = resValue
        return caseDetails
}

async function execute() {
    let result = await getCaseDetails(url)
    console.log(result)
}

execute()
