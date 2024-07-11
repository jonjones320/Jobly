"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company is already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }




  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = {}) {
    // SQL query starting point that will be built-on with filters
    // If no filters, this is the entirety of the query.
    let query =
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
      FROM companies`;
    
    // values will be all of the filter values for SQL to inject.
    let values = [];
    // slqToInsert is the SQL strings with the designator correlating to the filter values. 
    let sqlToInsert = [];

    // declare each filter individually.
    const { name, minEmployees, maxEmployees} = filters;

    // filter input value (if any) is put into the values list and designated its SQL string 
    // based on position in the list. SQL uses the input to search 
    // with no regards to case-sensitivity nor positioning in a word or phrase. 
    if (name !== undefined) {
      values.push(`%${name}%`);
      sqlToInsert.push(`name ILIKE $${values.length}`)
    }
    // num_employees filtering works the same except greater-than/less-than is 
    // applied relative to the number of employees, instead of a search function.
    if (minEmployees !== undefined) {
      values.push(`%${minEmployees}%`);
      sqlToInsert.push(`num_employees >= $${values.length}`)
    }
    if (maxEmployees !== undefined) {
      values.push(`%${maxEmployees}%`);
      sqlToInsert.push(`num_employees <= $${values.length}`)
    }
    
    // If there is multiple filters, creates the SQL string: 
    // `WHERE filter AND notherFilter AND notherOne`
    if (sqlToInsert.length > 0) {
      query += "WHERE" + sqlToInsert.join(" AND ");
    }

    // then add the organizing SQL to complete the query string.
    query += `ORDER BY name`;
    // query the database for all companies with the applied filters.
    const companiesRes = await db.query(query, values);
    return companiesRes.rows;
  };




  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
