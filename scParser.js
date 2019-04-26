const request = require('request')
const mongodb = require('mongodb')
const dbUrl = 'mongodb://localhost:27017'
const {
  ObjectId,
} = mongodb

const getOptions = (form) => {
  delete form._id
  return {
    url: 'https://www.sci.gov.in/php/getAdvocateNameDetails.php',
    method: 'POST',
    headers: {
      'cache-control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
      'Referer': 'https://www.sci.gov.in/case-status',
      'Origin': 'https://www.sci.gov.in',
      'Host': 'www.sci.gov.in',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    form,
  }
}

function getMongoDbConnection (dburl) {
  return new Promise((resolve, reject) => {
    if (global.db) {
      return resolve(global.db)
    }
    require('mongodb').MongoClient.connect(dburl, (e, conn) => {
      if (e) return reject(`mongodb connection is not ready - FAILED - ${e}`)
      const query = { _doctype: 'environment-config' }
      conn = conn.db('vs-court-agent')
      global.db = { url: dburl, conn }
      return resolve({ url: dburl, conn })
    })
  })
}

function parse (html) {

}

async function persistInDb (json, aor) {

}

async function updateDb (_id, html) {
  const {
    conn: db,
  } = await getMongoDbConnection(dbUrl)
  return db.getCollection('payload').update(
    {
      _id: ObjectId(_id),
    },
    {
      $set: {
        processed: true,
        html,
      },
    }
  )
}

(async () => {
  const offset = 20
  const count = 0
  let flag = true
  const {
    conn: db,
  } = await getMongoDbConnection(dbUrl)
  while (flag) {
    const docs = await db.getCollection('payload').find({processed: {$exists: false}}).skip(count).limit(offset).toArray()
    const requests = []
    for (let i = 0, ii = docs.length; i < ii; i++) {
      const obj = docs[i]
      const _id = obj._id
      let html = ''
      const promise = makeRequest(getOptions(obj))
        .then(res => {
            html += res
            return parse(res)
        })
        .then(json => {
          return persistInDb(json, obj.AOR)
        })
        .then(() => {
          return updateDb(_id, html)
        })
        .catch(e => {
          return Promise.resolve(undefined)
        })
        requests.push(promise)
    }
    await Promise.all(requests)
    count += offset
    if (docs.length < offset) {
      flag = false
    }
  }
})()

function makeRequest () {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        return reject(err || res.statusCode)
      } else {
        return resolve(body)
      }
    })
  })
}
