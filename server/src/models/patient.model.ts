import mongoose, { Model, HydratedDocument, Types } from "mongoose";

export interface IPatient {
  name: string;
  condition: string;
  assignedDoctorId: Types.ObjectId;
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PatientDocument = HydratedDocument<IPatient>;
export type PatientModel = Model<IPatient>;

const patientSchema = new mongoose.Schema<IPatient, PatientModel>(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    condition: {
      type: String,
      required: [true, "Patient condition is required"],
      trim: true,
      minlength: [2, "Condition must be at least 2 characters"],
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Assigned doctor reference is required"],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes per approved schema design
// Compound index for querying a doctor's patients in reverse-chronological order
patientSchema.index({ assignedDoctorId: 1, createdAt: -1 });

// Compound index for condition-based filtering with sorted pagination
patientSchema.index({ condition: 1, createdAt: -1 });

// Single-field index for global date-wise filtering and dashboard trend aggregations
patientSchema.index({ createdAt: -1 });

// Text index for patient name search
patientSchema.index({ name: "text" });

// Partial index for exact phone-number searches (indexes only non-null string values)
patientSchema.index(
  { phone: 1 },
  {
    partialFilterExpression: {
      phone: { $type: "string" },
    },
  },
);

// Prevent model recompilation in watch/dev environments
export const Patient =
  (mongoose.models.Patient as PatientModel) ||
  mongoose.model<IPatient, PatientModel>("Patient", patientSchema);

export default Patient;
