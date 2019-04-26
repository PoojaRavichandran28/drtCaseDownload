let moment = require('moment')
let date = new Date('2019-03-28T18:30:00.000Z')
console.log(moment(date).format('DD')+moment(date).format('MM')+moment(date).format('YY'))


