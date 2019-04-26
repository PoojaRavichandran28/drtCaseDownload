const MongoClient = require('mongodb').MongoClient
const payload = require('./payload')
const url = 'mongodb://localhost:27017/'
async function execute() {
    let pl = await payload.payload()
    MongoClient.connect(url, (err, db) => {
        if (err) throw err
        console.log('Connected!!!')
        let payloadDb = db.db('vs-court-agent')
        for(let i = 0; i < pl.length; i++) {
        let payloadObj = pl[i]
        payloadDb.collection('payload').insert(payloadObj, (err, result) => {
            if (err) throw err
        })
        }
        console.log('Done')
    })
    
}

execute()