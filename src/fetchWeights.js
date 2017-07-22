const fetch = require('node-fetch');

// console.log( fetch );

// let RESULTS_URL = "http://localhost:5000/getWeights";
let RESULTS_URL = "http://berndmalle.com:5050/getWeights";

function getWeights() {
  fetch(RESULTS_URL)
    .then(res => {
      return res.json()
    })
    .then(json => {
      console.log(Object.keys(json.results));
      Object.keys(json.results).forEach( (res_idx) => {
        let res = json.results[res_idx];
        console.log(`Group: ${res.grouptoken}\n Target: ${res.target}\n Bias: ${res.weights_bias}\n iML: ${res.weights_iml}\n`)
      });
    })
    .catch(err => console.error(err));;
}

module.exports = {
  getWeights: getWeights
}

getWeights();