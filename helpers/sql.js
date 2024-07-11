// Takes JS input to make a SQL fragment string. //

// ---EXAMPLE--- //
// const dataToUpdate = { firstName: 'Aliya', age: 32 };
// const jsToSql = { firstName: 'first_name' };
// const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
// result: { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] }



// BadRequestError is used when the 'dataToUpdate' is empty. //
const { BadRequestError } = require("../expressError");


// Receives two arguments:
//    'dataToUpdate': object with keys showing the fields to update and values equaling the new values.
//    'jsToSql': object which directs which database column names to map.
function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  // retrieve the fields to be updated via the keys //
  const keys = Object.keys(dataToUpdate);

  // if no keys, then it was a bad request with no data //
  if (keys.length === 0) throw new BadRequestError("No data");

  // Maps together a string that takes the keys and correlates them to an index number.
  // Example: {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Takes the key-index string and joins them, 
  // then adds the 'values' element that SQL will use to correlate to the key indexes.
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// Exports the finished function. //
module.exports = { sqlForPartialUpdate };
