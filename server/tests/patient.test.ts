import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectTestDb, clearTestDb, disconnectTestDb, createTestAdmin } from "./helpers/test-db.js";
import { Doctor } from "../src/models/doctor.model.js";
import { Patient } from "../src/models/patient.model.js";

describe("Phase 07, 08 & 10: Patient CRUD, Search & Integrity Test Suite", () => {
  let authCookie: string;
  let sampleDoctor: InstanceType<typeof Doctor>;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const { cookie } = await createTestAdmin();
    authCookie = cookie;

    sampleDoctor = await Doctor.create({
      name: "Dr. Gregory House",
      specialization: "Nephrology",
      hospital: "Princeton-Plainsboro",
      phone: "+1-555-0199",
      email: "house@princeton.edu",
    });
  });

  it("should block unauthenticated access to Patient endpoints with 401", async () => {
    const res = await request(app).get("/api/v1/patients");
    expect(res.status).toBe(401);
  });

  it("should create a Patient with valid required fields including age and gender", async () => {
    const patientData = {
      name: "Jane Doe",
      condition: "Hypertension",
      assignedDoctorId: sampleDoctor._id.toString(),
      age: 35,
      gender: "female",
      phone: "+1-555-9876",
    };

    const res = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", authCookie)
      .send(patientData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Jane Doe");
    expect(res.body.data.age).toBe(35);
    expect(res.body.data.gender).toBe("female");
    expect(res.body.data.assignedDoctorId).toBe(sampleDoctor._id.toString());
  });

  it("should reject Patient creation if assigned doctor does not exist (400)", async () => {
    const nonExistentDocId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", authCookie)
      .send({
        name: "Orphan Patient",
        condition: "Fever",
        assignedDoctorId: nonExistentDocId,
        age: 20,
        gender: "male",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("does not exist");
  });

  it("should reject invalid age and gender values with 422", async () => {
    const badAgeRes = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", authCookie)
      .send({
        name: "Bad Age",
        condition: "Cold",
        assignedDoctorId: sampleDoctor._id.toString(),
        age: 150, // max 120
        gender: "male",
      });
    expect(badAgeRes.status).toBe(422);

    const badGenderRes = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", authCookie)
      .send({
        name: "Bad Gender",
        condition: "Cold",
        assignedDoctorId: sampleDoctor._id.toString(),
        age: 25,
        gender: "unsupported_gender",
      });
    expect(badGenderRes.status).toBe(422);
  });

  it("should retrieve a patient by ID and return 404 for non-existent ID", async () => {
    const patient = await Patient.create({
      name: "John Smith",
      condition: "Asthma",
      assignedDoctorId: sampleDoctor._id,
      age: 45,
      gender: "male",
    });

    const getRes = await request(app)
      .get(`/api/v1/patients/${patient._id}`)
      .set("Cookie", authCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe("John Smith");

    const notFoundRes = await request(app)
      .get(`/api/v1/patients/${new mongoose.Types.ObjectId()}`)
      .set("Cookie", authCookie);
    expect(notFoundRes.status).toBe(404);
  });

  it("should partially update a patient and validate doctor if reassigned", async () => {
    const patient = await Patient.create({
      name: "Mark Johnson",
      condition: "Diabetes",
      assignedDoctorId: sampleDoctor._id,
      age: 50,
      gender: "male",
    });

    // Reassigning to non-existent doctor fails with 400
    const badReassignRes = await request(app)
      .patch(`/api/v1/patients/${patient._id}`)
      .set("Cookie", authCookie)
      .send({ assignedDoctorId: new mongoose.Types.ObjectId().toString() });
    expect(badReassignRes.status).toBe(400);

    // Valid partial update
    const updateRes = await request(app)
      .patch(`/api/v1/patients/${patient._id}`)
      .set("Cookie", authCookie)
      .send({ condition: "Controlled Diabetes", age: 51 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.condition).toBe("Controlled Diabetes");
    expect(updateRes.body.data.age).toBe(51);
    expect(updateRes.body.data.name).toBe("Mark Johnson");
  });

  it("should delete a patient without modifying or deleting the assigned doctor", async () => {
    const patient = await Patient.create({
      name: "Temporary Patient",
      condition: "Mild Flu",
      assignedDoctorId: sampleDoctor._id,
      age: 22,
      gender: "other",
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/patients/${patient._id}`)
      .set("Cookie", authCookie);

    expect(deleteRes.status).toBe(200);

    // Patient is deleted
    const patientInDb = await Patient.findById(patient._id);
    expect(patientInDb).toBeNull();

    // Doctor is untouched
    const doctorInDb = await Doctor.findById(sampleDoctor._id);
    expect(doctorInDb).not.toBeNull();
  });

  it("should support search, exact condition filter, and date ranges with pagination", async () => {
    const baseDate = new Date("2026-05-01T10:00:00.000Z");
    const patients = [];
    const conditions = ["Hypertension", "Diabetes", "Asthma"];
    for (let i = 1; i <= 15; i++) {
      patients.push({
        name: `Patient_${i.toString().padStart(2, "0")} Smith`,
        condition: conditions[i % conditions.length]!,
        assignedDoctorId: sampleDoctor._id,
        age: 20 + i,
        gender: i % 2 === 0 ? "female" : "male",
        phone: `+1-555-88${i.toString().padStart(2, "0")}`,
        createdAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
      });
    }
    await Patient.insertMany(patients);

    // Pagination
    const listRes = await request(app)
      .get("/api/v1/patients?page=1&limit=10")
      .set("Cookie", authCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(10);
    expect(listRes.body.meta.total).toBe(15);

    // Condition filter
    const condRes = await request(app)
      .get("/api/v1/patients?condition=Hypertension")
      .set("Cookie", authCookie);
    expect(condRes.status).toBe(200);
    expect(condRes.body.meta.total).toBe(5);

    // Regex metacharacter escaping
    const regexRes = await request(app)
      .get("/api/v1/patients?search=.*")
      .set("Cookie", authCookie);
    expect(regexRes.status).toBe(200);
    expect(regexRes.body.data.length).toBe(0);
  });
});

