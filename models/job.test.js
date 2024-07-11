"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    id: "1",
    title: "New",
    salary: 11000,
    equity: 0,
    companyHandle: "berkshire",
  };

  test("works", async function () {
    let company = await Company.create(newJob);
    expect(company).toEqual(newJob);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 'new'`);
    expect(result.rows).toEqual([
      {
        id: "1",
        title: "New",
        salary: 11000,
        equity: 1,
        company_handle: "berkshire",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
    {
        id: "j1",
        title: "Conservator",
        salary: 110000,
        equity: "0",
        companyHandle: "watson-davis",
        },
        {
        id: "j2",
        name: "Information officer",
        salary: 200000,
        equity: "0",
        companyHandle: "hall-mills",
        },
        {
        id: "j3",
        name: "Consulting civil engineer",
        salary: 60000,
        equity: "Desc3",
        companyHandle: "sellers-bryant",
        },
    ]);
  });

  test("works: title filter", async function () {
    let jobs = await Job.findAll({title : "j1"});
    expect(jobs).toEqual([
        {
        id: "j1",
        title: "Conservator",
        salary: 110000,
        equity: "0",
        companyHandle: "watson-davis",
        }
    ]);
  });

  test("works: minSalary filter", async function () {
    let jobs = await Company.findAll({minSalary : 21000});
    expect(jobs).toEqual([
        {
            id: "j3",
            name: "Consulting civil engineer",
            salary: 60000,
            equity: "Desc3",
            companyHandle: "sellers-bryant",
        },
    ]);
  });

  test("works: hasEquity filter", async function () {
    let jobs = await Company.findAll({hasEquity : True});
    expect(jobs).toEqual([
        {
            id: "j3",
            name: "Consulting civil engineer",
            salary: 60000,
            equity: 1,
            companyHandle: "sellers-bryant",
          }
    ]);

  test("works: multiple filters", async function () {
    let jobs = await Company.findAll({title: "j", minSalary: 1000});
    expect(jobs).toEqual([
        {
        id: "j2",
        name: "Information officer",
        salary: 200000,
        equity: "0",
        companyHandle: "hall-mills",
        },
        {
        id: "j3",
        name: "Consulting civil engineer",
        salary: 60000,
        equity: 1,
        companyHandle: "sellers-bryant",
        }
    ]);
  });
})});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j3");
    expect(job).toEqual({
        id: "j3",
        name: "Consulting civil engineer",
        salary: 60000,
        equity: 1,
        companyHandle: "sellers-bryant",
      });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 230000,
    equity: 3,
    companyHandle: "berkshire",
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      id: "j1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, companyHandle
           FROM jobs
           WHERE id = 'j1'`);
    expect(result.rows).toEqual([{
      id: "j1",
      title: "New",
      salary: 230000,
      equity: 3,
      company_handle: "berkshire",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Different",
      salary: 21000,
      equity: null,
      companyHandle: null,
    };

    let job = await Job.update("j1", updateDataSetNulls);
    expect(job).toEqual({
      id: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, companyHandle
           FROM jobs
           WHERE id = 'j1'`);
    expect(result.rows).toEqual([{
      id: "j1",
      title: "Different",
      salary: 21000,
      equity: null,
      company_handle: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("j1");
    const res = await db.query(
        "SELECT id FROM jobs WHERE id='j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
