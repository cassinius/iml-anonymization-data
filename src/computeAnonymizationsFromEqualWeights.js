const fs = require('fs');
const $A = require('anonymizationjs');
const $GH = require('./genHierarchies');

let TARGETS = ["income", "marital-status", "education-num"];
let Ks = [5, 10, 20, 50, 100, 200];
let DRAWS = 3000;

let csvIN = new $A.IO.CSVIN($A.config.adults),
    adults_original_file = "../inputs/original_data_5000_rows.csv",
    adults_original_csv = csvIN.readCSVFromFile(adults_original_file, true);

// Specify Generalization hierarchy files
let gen_base = '../inputs/genHierarchies/',
    workclass_file = gen_base + 'workclassGH.json',
    sex_file = gen_base + 'sexGH.json',
    race_file = gen_base + 'raceGH.json',
    marital_file = gen_base + 'marital-statusGH.json',
    nat_country_file = gen_base + 'native-countryGH.json',
    relationship_file = gen_base + 'relationshipGH.json',
    occupation_file = gen_base + 'occupationGH.json',
    income_file = gen_base + 'incomeGH.json';


TARGETS.forEach( (target) => {
  let config = $A.config.adults;
  
  setEqualWeights(config, target);

  config['TARGET_COLUMN'] = target;
  config.NR_DRAWS = DRAWS;

  Ks.forEach( (k_factor) => {
    console.log(`Working on target ${target}, weights: equal, k-factor: ${k_factor}`);
    config.K_FACTOR = k_factor;

    let san = new $A.algorithms.Sangreea("testus", config);
    $GH.setGenHierarchies(san, target);

    // Need to read the string array again, as it is mutated while being processed
    adults_original_csv = csvIN.readCSVFromFile(adults_original_file, true);
    san.instantiateGraph(adults_original_csv, false);

    san.anonymizeGraph();

    // determine filename & write anonymized output file as CSV
    let filename = `../outputs/adults_${target}_equal_${k_factor}.csv`;
    let csv_string = san.constructAnonymizedCSV();
    fs.writeFileSync(filename, csv_string);
  });

});



function setEqualWeights(config, target) {
  config['GEN_WEIGHT_VECTORS']['equal'] = {
    'categorical': {
        'workclass': 1.0/10.0,
        'native-country': 1.0/10.0,
        'sex': 1.0/10.0,
        'race': 1.0/10.0,
        'relationship': 1.0/10.0,
        'occupation': 1.0/10.0
    },
    'range': {
        'age': 1.0/10.0,
        'hours-per-week': 1.0/10.0
    }
  }
  let cats = config['GEN_WEIGHT_VECTORS']['equal'].categorical,
      ranges = config['GEN_WEIGHT_VECTORS']['equal'].range;

  if ( target === 'marital-status' ) {
    cats['income'] = 1.0/10.0;
    ranges['education-num'] = 1.0/10.0;
  }
  if ( target === 'income' ) {
    cats['marital-status'] = 1.0/10.0; 
    ranges['education-num'] = 1.0/10.0;
  }
  if ( target === 'education-num' ) {
    cats['income'] = 1.0/10.0;
    cats['marital-status'] = 1.0/10.0;
  }
}