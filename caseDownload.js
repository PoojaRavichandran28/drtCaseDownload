const cheerio = require('cheerio')
const request = require('request')



exports.getCaseDetails = async function(url) {
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
         endPoint = $('td').find('a').attr('href').match(/'(.*?)'/g)[0].replace(/'*/g,'')
        }
     return 'http://drt.etribunals.gov.in/drtlive/Misdetailreport.php?no='+endPoint
}

function getDetails(casePage) {
    let $ = cheerio.load(casePage)
    let caseDetails = {}
    let details = []
    let caseProceedings = []
    $('table').each((i,table) => {
            if (i === 0 || i === 3 || i ===4) {
                const rows  = $(table).find('tr')
                rows.each((j, row) => {
                    const cols = $(row).find('td')
                    if (i === 0) {
                        let key = $(cols[0]).text().split('/').length === 2 ? $(cols[0]).text().split('/')[0] : $(cols[0]).text()
                        let value = $(cols[1]).text()
                        if (value.trim())
                        caseDetails[key] = value
                    } else if (i === 3) {
                        if($(row).text().includes('Petitioner Name') || $(row).text().includes('Respondent Name'))
                        details.push($(row).text().replace(/\n/g,'').replace(/\s+/g,' '))
                    } else if (i ===4) {
                        if(j!==0 && j!==1 && j!==rows.length-1){
                            let caseProceedingElement = {}
                            caseProceedingElement['Bench No'] = $(cols[0]).text()
                            let date = new Date($(cols[1]).text())
                            let isoDate = date.toISOString()
                            caseProceedingElement['Hearing Date'] = isoDate
                            caseProceedingElement['Purpose'] = $(cols[2]).text()
                            caseProceedingElement['Status'] = $(cols[3]).text()
                            caseProceedingElement['Order'] = $(cols[4]).text()
                            caseProceedings.push(caseProceedingElement)
                            }
                    }
                })
            }
        })
        getPetitionerDetails(caseDetails,details)
        getRespondentDetails(caseDetails,details)
        caseDetails['party'] = caseDetails['Petitioner Name ']+' VS '+caseDetails['Respondent Name ']
        caseDetails['caseProceedings'] = caseProceedings
        
    return caseDetails
}

function getPetitionerDetails(caseDetails, details) {
    let pet = details[0].split('Pet. Advocate Name:')[0]
                  .split('pet. Address:')[0]
                  .replace('Additional Party(Pet.):',',')
                  .split(',')
                  .map(el => el.trim())
        let petKey = pet[0].split('-')[0]
        let petValueRaw = pet.map(el => el.replace('Petitioner Name -',''))
        let petValue = petValueRaw.slice(0,petValueRaw.length-1) 
    let petAdv = details[0].split('Pet. Advocate Name:')[1]
                 .replace('Additional Advocate(Pet.):',',')
                 .split(',')
                 .map(el => el.trim())
        let petAdvKey = 'pAdvocate'
        let petAdvValue = petAdv.slice(0,petAdv.length-1)
        caseDetails[petKey] = petValue
        caseDetails[petAdvKey] = petAdvValue
        return caseDetails
}

function getRespondentDetails(caseDetails, details) {
    let res = details[1].split('Respondent Advocate -')[0]
                  .split('Res. Address:')[0]
                  .replace('Additional Party(Res.):',',')
                  .split(',')
                  .map(el => el.trim())
        let resKey = res[0].split('-')[0]
        let resValueRaw = res.map(el => el.replace('Respondent Name -',''))
        let resValue = resValueRaw.slice(0,resValueRaw.length-1)
    let resAdv = details[1].split('Respondent Advocate -')[1]
                .replace('Additional Advocate(Res.):',',')
                .split(',')
                .map(el => el.trim())
        let resAdvKey = 'rAdvocate'
        let resAdvValue = resAdv.slice(0,resAdv.length-1)
        caseDetails[resKey] = resValue
        caseDetails[resAdvKey] = resAdvValue
        return caseDetails
}
