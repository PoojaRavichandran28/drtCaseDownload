const caseDownload = require('./caseDownload')
const dailyOrder = require('./dailyOrders')
const url = 'http://drt.etribunals.gov.in/drtlive/partyDetail.php?caseNo=120&caseType=1&year=2017&sc=delhi&id=casetypewise'
async function execute() {
    let cdl = await caseDownload.getCaseDetails(url)
    let dor = await dailyOrder.getDailyOrder()
    cdl['dailyOrders'] = dor
    console.log(cdl)
}

execute()