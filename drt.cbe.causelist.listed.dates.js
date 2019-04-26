const cheerio = require('cheerio')
const request = require('request')

module.exports = {
  async handle (jcard) {
    const {url} = jcard.data
    const page = await fetchPage(url)
    const dates = parseDates(page, url)
    const list = getList(dates, jcard)
    return list
  },
}

/**
 * return the html body
 * @param {*} url
 */

function fetchPage (url) {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (err) reject(err)
      resolve(body)
    })
  })
}

/**
 * parse listed date from source site
 * @param {*} page
 * @param {*} url
 */

function parseDates (page, url) {
  const $ = cheerio.load(page)
  const baseUrl = url.replace(/\/po_court.htm/igm, '/')
  const listedDates = []
  const today = new Date().setHours(0, 0, 0, 0)
  $($('select')[0]).find('option').each((no, datelist) => {
    const rawDate = $(datelist).text().replace(',', '').trim()
    const [dd, mm, yyyy] = rawDate.split(' ')
    const newdd = dd.replace(/st|th|rd|nd/igm, '')
    const date = new Date(`${newdd} ${mm} ${yyyy}`)
    if (date >= today && date.toString() !== 'Invalid Date') {
      listedDates.push({
        date: `${newdd} ${mm} ${yyyy}`,
        url: baseUrl + $(datelist).val(),
      })
    }
  })
  return listedDates
}

/**
 * formating the avail data
 * @param {*} dates
 * @param {*} jcard
 */

function getList (dates, jcard) {
  const availDates = []
  dates.map(dateString => {
    const dateObj = {
      courtId: jcard.courtId,
      courtKey: jcard.courtKey,
      date: new Date(),
      homeUrl: dateString.url,
      listedDate: new Date(dateString.date),
      listName: jcard.data.listName,
    }
    availDates.push(dateObj)
  })
  return availDates
}

