import mongoose, { Model, HydratedDocument } from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IDoctor {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DoctorDocument = HydratedDocument<IDoctor>;
export type DoctorModel = Model<IDoctor>;

const doctorSchema = new mongoose.Schema<IDoctor, DoctorModel>(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      minlength: [2, "Specialization must be at least 2 characters"],
    },
    hospital: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
      minlength: [2, "Hospital must be at least 2 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Doctor email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes per approved schema design
// Single-field index for date-wise filtering and sorting
doctorSchema.index({ createdAt: -1 });

// Compound index for specialty filtering combined with date sorting
doctorSchema.index({ specialization: 1, createdAt: -1 });

// Text index for multi-field search (name, specialization, hospital)
doctorSchema.index({ name: "text", specialization: "text", hospital: "text" });

// Prevent model recompilation in watch/dev environments
export const Doctor =
  (mongoose.models.Doctor as DoctorModel) ||
  mongoose.model<IDoctor, DoctorModel>("Doctor", doctorSchema);

export default Doctor;
