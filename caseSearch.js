let caseSearch = require('./caseNoSearch')
let partySearch = require('./partySearch')
let advocateSearch = require('./advSearch')
const caseNoSearchUrl = 'http://drt.etribunals.gov.in/drtlive/partyDetail.php?caseNo=120&caseType=1&year=2017&sc=delhi&id=casetypewise'
const ptySearchUrl = 'http://drt.etribunals.gov.in/drtlive/partyDetail.php?caseNo=KAMAL%20&caseType=3&sc=delhi&id=partynamewise'
const advSearchUrl = 'http://drt.etribunals.gov.in/drtlive/partyDetail.php?nameAdv=raja&AdvocateType=1&sc=bangalore1&id=advnamewise'

async function execute() {
    let caseNoSearch = await caseSearch.getCaseDetails(caseNoSearchUrl)
    let ptySearch = await partySearch.partySearch(ptySearchUrl)
    let advSearch = await advocateSearch.advSearch(advSearchUrl)
    console.log('Results of Case no search.....')
    console.log(caseNoSearch)
    console.log('Results of Party search.....')
    console.log(ptySearch)
    console.log('Results of Advocate search.....')
    console.log(advSearch)
}

execute()