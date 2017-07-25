const fs = require('fs');
const $A = require('anonymizationjs');
const $FW = require('./fetchWeights');

// console.log($A);

let TARGETS = ["income", "marital-status", "education-num"];
let Ks = [5, 10, 20, 50, 100, 200];
// let Ks = [5]; // test
let DRAWS = 3000;
let weight_category = ["weights_bias", "weights_iml"];

let csvIN = new $A.IO.CSVIN($A.config.adults),
    adults_original_file = "../inputs/original_data_5000_rows.csv",
    adults_original_csv = csvIN.readCSVFromFile(adults_original_file, true);

// console.log(adults_original_csv);

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


$FW.getWeights(anonymizeData);


function anonymizeData(json) {
  Object.keys(json).forEach( (res_idx) => {
    let res = json[res_idx];
    let target = res.target;

    // Instantiate SaNGreeA
    let config = $A.config.adults;

    weight_category.forEach( (weight_cat) => {

      console.log(`\n\nWorking on target ${target}, weights: ${weight_cat}`);

      let cur_weights = JSON.parse(res[weight_cat]);
      setWeights(config, cur_weights, target);
      config['VECTOR'] = 'custom';
      config['TARGET_COLUMN'] = target;
      config.NR_DRAWS = DRAWS;

      Ks.forEach( (k_factor) => {
        config.K_FACTOR = k_factor;

        let san = new $A.algorithms.Sangreea("testus", config);
        setGenHierarchies(san, target);
        
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


function setGenHierarchies(san, target) {
  // Load Generalization hierarchies
  [workclass_file, nat_country_file, sex_file, race_file,
    relationship_file, occupation_file].forEach((genHFile) => { 
    strgh = new $A.genHierarchy.Category(genHFile);
    san.setCatHierarchy(strgh._name, strgh);
  });
  if ( target === 'marital-status' ) {
    strgh = new $A.genHierarchy.Category(income_file);
    san.setCatHierarchy(strgh._name, strgh);
  }
  if ( target === 'income' ) {
    strgh = new $A.genHierarchy.Category(marital_file);
    san.setCatHierarchy(strgh._name, strgh);
  }
  if ( target === 'education-num' ) {
    [marital_file, income_file].forEach((genHFile) => { 
      strgh = new $A.genHierarchy.Category(genHFile);
      san.setCatHierarchy(strgh._name, strgh);
    });
  }
}


function setWeights(config, cur_weights, target) {
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
