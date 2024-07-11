"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token, u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /job */

describe("POST /job", function () {
  const newJob = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/job")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/job")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/job")
        .send({
          ...newJob,
          company_handle: "not-a-company",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /job */

describe("GET /job", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/job");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job:
          [
            {
                id: "j1",
                title: "Conservator",
                salary: 110000,
                equity: "0",
                company_handle: "watson-davis",
            },
            {
                id: "j2",
                name: "Information officer",
                salary: 200000,
                equity: "0",
                company_handle: "hall-mills",
            },
            {
                id: "j3",
                name: "Consulting civil engineer",
                salary: 60000,
                equity: "0",
                company_handle: "sellers-bryant",
            },
          ],
    });
  });

  test("works: title filter", async function() {
    const resp = await request(app).get("/job").query({ title : "Conservator" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(
        {
            id: "j1",
            title: "Conservator",
            salary: 110000,
            equity: "0",
            company_handle: "watson-davis",
        });
  })

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE job CASCADE");
    const resp = await request(app)
        .get("/job")
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /job/:handle */

describe("GET /job/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/job/c1`);
    expect(resp.body).toEqual({
      job:  {
        id: "j1",
        title: "Conservator",
        salary: 110000,
        equity: "0",
        company_handle: "watson-davis",
    },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/job/c2`);
    expect(resp.body).toEqual({
        job:  {
          id: "j1",
          title: "Conservator",
          salary: 110000,
          equity: "0",
          company_handle: "watson-davis",
      },
      });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/job/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /job/:handle */

describe("PATCH /job/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/job/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
        job:  {
          id: "j1",
          title: "Conservator",
          salary: 110000,
          equity: "0",
          company_handle: "watson-davis",
      },
      });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/job/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/job/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/job/c1`)
        .send({
          id: "c1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/job/c1`)
        .send({
          company_handle: "not-a-company",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /job/:handle */

describe("DELETE /job/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/job/c1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/job/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/job/nope`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
