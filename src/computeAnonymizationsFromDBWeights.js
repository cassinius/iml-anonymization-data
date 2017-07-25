const fs = require('fs');
const $A = require('anonymizationjs');
const $FW = require('./fetchWeights');
const $GH = require('./genHierarchies');

let Ks = [5, 10, 20, 50, 100, 200];
// let Ks = [5]; // test
let DRAWS = 3000;
let weight_category = ["weights_bias", "weights_iml"];

let csvIN = new $A.IO.CSVIN($A.config.adults),
    adults_original_file = "../inputs/original_data_5000_rows.csv",
    adults_original_csv = csvIN.readCSVFromFile(adults_original_file, true);


$FW.getWeights(anonymizeData);


function anonymizeData(json) {
  Object.keys(json).forEach( (res_idx) => {
    let res = json[res_idx];
    let target = res.target;

    // Instantiate SaNGreeA
    let config = $A.config.adults;

    weight_category.forEach( (weight_cat) => {
      let cur_weights = JSON.parse(res[weight_cat]);

      // cur_weights are determined by bias/iml...
      setWeights(config, target, cur_weights);
      config['VECTOR'] = 'custom';
      config['TARGET_COLUMN'] = target;
      config.NR_DRAWS = DRAWS;

      Ks.forEach( (k_factor) => {
        console.log(`\n\nWorking on target ${target}, weights: ${weight_cat}, k-factor: ${k_factor}`);
        config.K_FACTOR = k_factor;

        let san = new $A.algorithms.Sangreea("testus", config);
        $GH.setGenHierarchies(san, target);
        
        // Need to read the string array again, as it is mutated while being processed
        adults_original_csv = csvIN.readCSVFromFile(adults_original_file, true);
        san.instantiateGraph(adults_original_csv, false);
        // console.log(san._graph.getStats());
        san.anonymizeGraph();

        // determine filename & write anonymized output file as CSV
        let filename = `../outputs/${res_idx}_${res.grouptoken}_${res.usertoken}_${target}_${weight_cat.split('_')[1]}_${k_factor}.csv`;
        let csv_string = san.constructAnonymizedCSV();
        fs.writeFileSync(filename, csv_string);
      });
    });
  });
}


function setWeights(config, target, cur_weights) {
  if ( cur_weights == null ) {
    throw new Error("invalid weight settings.");
  }

  config['GEN_WEIGHT_VECTORS']['custom'] = {
        'categorical': {},
        'range': {}
  };

  let weights = config['GEN_WEIGHT_VECTORS']['custom'],
      cats = weights.categorical,
      ranges = weights.range;

  // for all targets
  cats['workclass'] = cur_weights['workclass'];
  cats['native-country'] = cur_weights['native-country'];
  cats['sex'] = cur_weights['sex'];
  cats['race'] = cur_weights['race'];
  cats['relationship'] = cur_weights['relationship'];
  cats['occupation'] = cur_weights['occupation'];

  ranges['age'] = cur_weights['age'];
  ranges['hours-per-week'] = cur_weights['hours-per-week'];

  if ( target === 'marital-status' ) {
    cats['income'] = cur_weights['income'];
    ranges['education-num'] = cur_weights['education-num'];
  }
  if ( target === 'income' ) {
    cats['marital-status'] = cur_weights['marital-status'];    
    ranges['education-num'] = cur_weights['education-num'];
  }
  if ( target === 'education-num' ) {
    cats['income'] = cur_weights['income'];
    cats['marital-status'] = cur_weights['marital-status'];  
  }

  // console.log(config['GEN_WEIGHT_VECTORS']['custom']);
}
