const $A = require('anonymizationjs');

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

module.exports = {
  setGenHierarchies: setGenHierarchies
};