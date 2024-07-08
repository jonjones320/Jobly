// Testing for the SQL Helper function 'sqlForPartialUpdate' //

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");



describe("sqlForPartialUpdate", function () {
  test("Single field test", function () {
    const dataToUpdate = { firstName: "Aliya" };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Aliya"],
    });
  });

  test("Multiple fields test", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("throws error if no data", function () {
    expect(() => {
      sqlForPartialUpdate({}, {});
    }).toThrow(BadRequestError);
  });
});
