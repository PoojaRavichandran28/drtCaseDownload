const aorList = require('./AORlist')
const startYear = 2000
const endYear = 2019
const payload = []
exports.payload = function() {
    for( let i = 0; i < aorList.features.length; i++) {
        for (let j = startYear; j <= endYear; j++) {
            payload.push({
                ANparty_type: ' P',
                AOR: aorList.features[i]['AOR Code'],
                Advocatename: ' ',
                ANyear: j,
                ANppd: ' P',
                page: ' 1',
                undefined: undefined
            })
            payload.push({
                ANparty_type: ' P',
                AOR: aorList.features[i]['AOR Code'],
                Advocatename: ' ',
                ANyear: j,
                ANppd: ' D',
                page: ' 1',
                undefined: undefined
            })
            payload.push({
                ANparty_type: ' R',
                AOR: aorList.features[i]['AOR Code'],
                Advocatename: ' ',
                ANyear: j,
                ANppd: ' P',
                page: ' 1',
                undefined: undefined
            })
            payload.push({
                ANparty_type: ' R',
                AOR: aorList.features[i]['AOR Code'],
                Advocatename: ' ',
                ANyear: j,
                ANppd: ' D',
                page: ' 1',
                undefined: undefined
            })
        }
    }
    console.log(payload)
    return payload
}
