"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job is already in database.
   * */

  static async create({ id, title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT id
           FROM jobs
           WHERE id = $1`,
        [id]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${id}`);

    const result = await db.query(
          `INSERT INTO jobs
           (id, title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          id,
          title,
          salary,
          equity,
          companyHandle,
        ],
    );
    const job = result.rows[0];

    return job;
  }




  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filters = {}) {
    // SQL query starting point that will be built-on with filters
    // If no filters, this is the entirety of the query.
    let query =
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
      FROM jobs`;
    
    // values will be all of the filter values for SQL to inject.
    let values = [];
    // slqToInsert is the SQL strings with the designator correlating to the filter values. 
    let sqlToInsert = [];

    // declare each filter individually.
    const { title, minSalary, hasEquity} = filters;

    // The filter input value (if any) is put into the values list and designated its SQL string 
    // based on position in the list. SQL uses the input to search 
    // with no regards to case-sensitivity nor positioning in a word or phrase. 
    if (title !== undefined) {
      values.push(`%${title}%`);
      sqlToInsert.push(`title ILIKE $${values.length}`)
    }
    // equity filtering is a simple Boolean check.
    if (hasEquity !== false) {
      values.push(`%True%`);
      sqlToInsert.push(`equity > $${values.length}`)
    }
    // minSalary (if selected) will return results higher than the minSalary filter.
    if (minSalary !== undefined) {
      values.push(`%${minSalary}%`);
      sqlToInsert.push(`salary >= $${values.length}`)
    }
    
    // If there is multiple filters, creates the SQL string, 
    // example: `WHERE filter AND notherFilter AND notherOne`
    if (sqlToInsert.length > 0) {
      query += "WHERE" + sqlToInsert.join(" AND ");
    }

    // then add the organizing SQL to complete the query string.
    query += `ORDER BY title`;
    // query the database for all jobs with the applied filters.
    const jobsRes = await db.query(query, values);
    return jobsRes.rows;
  };




  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, jobs }
   *   where jobs is [{ id, title, salary, equity, jobid }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          equity: "equity",
          companyHandle: "company_handle",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity AS "equity", 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
