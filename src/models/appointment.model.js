const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      index: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorProfile",
      required: true,
      index: true,
    },

    slot: {
      type: Date,
      required: true,
      index: true,
    },

    roomNo: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SCHEDULED", "JOIN", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      required: true,
    },

    paymentDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentDetails",
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

/* 🔒 Prevent double booking */
AppointmentSchema.index(
  { mentorId: 1, slot: 1 },
  { unique: true }
);

const Appointment = mongoose.model("Appointment", AppointmentSchema);
module.exports = Appointment;
