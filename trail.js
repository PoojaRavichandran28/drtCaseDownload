var request = require("request");
var payload = require("./payload").payload()

var options = {
    method: 'POST',
    url: 'https://www.sci.gov.in/php/getAdvocateNameDetails.php',
    headers: {
        'Postman-Token': '8b233140-ca38-482c-8eaa-ab574b51c15b',
        'cache-control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
        Referer: 'https://www.sci.gov.in/case-status',
        Origin: 'https://www.sci.gov.in',
        Host: 'www.sci.gov.in',
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: payload[0]
}

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
});