import mongoose, { Model, HydratedDocument } from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IAdmin {
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AdminDocument = HydratedDocument<IAdmin>;
export type AdminModel = Model<IAdmin>;

const adminSchema = new mongoose.Schema<IAdmin, AdminModel>(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// Prevent model recompilation in watch/dev environments
export const Admin =
  (mongoose.models.Admin as AdminModel) ||
  mongoose.model<IAdmin, AdminModel>("Admin", adminSchema);

export default Admin;
