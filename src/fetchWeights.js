const fetch = require('node-fetch');

// console.log( fetch );

let RESULTS_URL = "http://berndmalle.com:5050/getDBResults";

function getWeights() {
  fetch(RESULTS_URL)
    .then(res => {
      return res.json()
    })
    .then(json => {
      console.log(json)
    })
    .catch(err => console.error(err));;
}

module.exports = {
  getWeights: getWeights
}



getWeights();