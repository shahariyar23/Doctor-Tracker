import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';

export interface IRateLimit {
  key: string;
  totalHits: number;
  resetTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RateLimitDocument = HydratedDocument<IRateLimit>;
export type RateLimitModel = Model<IRateLimit>;

const rateLimitSchema = new Schema<IRateLimit, RateLimitModel>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalHits: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    resetTime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// TTL index for automatic expiration of rate limit entries in MongoDB
rateLimitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  (mongoose.models.RateLimit as RateLimitModel) ||
  mongoose.model<IRateLimit, RateLimitModel>('RateLimit', rateLimitSchema);

export default RateLimit;
