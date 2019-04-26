const source =[ {
    "judges": [
        "HON'BLE PRESIDING OFFICER"
    ],
    "time": "11.00 A.M",
    "date": "2019-04-02T18:30:00.000Z",
    "itemNo": "1",
    "caseNumber": "OA/786/2018",
    "petitioners": [
        "INDIAN OVERSEAS BANK"
    ],
    "respondents": [
        "TG MANJUNATHAN"
    ],
    "cause": "Misc Cases"
},
{
    "caseNumber": "OA/786/2018",
    "cause": "MISCELLANEOUS",
    "itemNo": "3",
    "judges": [
        "HON'BLE  PO"
    ],
    "date": "2019-04-02T18:30:00.000Z",
    "room": "",
    "time": ""
},
{
    "caseNumber": "OA/498/2016",
    "cause": "MATTERS FOR ORDERS",
    "itemNo": "30",
    "judges": [
        "HON'BLE  REGISTRAR"
    ],
    "date": "2019-04-02T18:30:00.000Z",
    "room": "",
    "time": ""
}]
let target = []
source.forEach((item) => {
    var existing = target.filter((v, i) => {
      return v.caseNumber == item.caseNumber
    })
    if (existing.length) {
      var existingIndex = target.indexOf(existing[0]);
      target[existingIndex].judges = target[existingIndex].judges.concat(item.judges);
    } else {
      if (typeof item.judges == 'string')
        item.judges = [item.judges];
      target.push(item);
    }
  })

  console.log(target)
