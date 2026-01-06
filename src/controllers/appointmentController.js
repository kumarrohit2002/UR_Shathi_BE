const Appointment = require('../models/appointment.model');
const MentorProfile = require('../models/MentorProfile.model');
const UserProfile = require('../models/UserProfile.model');
const PaymentDetails = require('../models/PaymentDetails.model');
const mongoose = require("mongoose");

const Razorpay = require('razorpay');
const crypto = require('crypto');

function convertToDateTime(dateTimeString) {
    const [datePart, timePart] = dateTimeString.split(" ");
    const fullDateTimeString = `${datePart} ${timePart}`;
    const date = new Date(fullDateTimeString);
    return isNaN(date) ? null : date;
}


exports.BookAppointment = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        /* ---------------- USER PROFILE ---------------- */
        const userId = req.user._id;

        const userProfile = await UserProfile.findOne({ user: userId }).session(session);
        if (!userProfile) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        /* ---------------- INPUT ---------------- */
        let { mentorProfile, slot, paymentDetails } = req.body;

        if (!mentorProfile?._id || !slot || !paymentDetails) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const mentorProfileId = mentorProfile._id;
        const userProfileId = userProfile._id;

        const slotDateTime = convertToDateTime(slot);
        if (!slotDateTime) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Invalid slot format",
            });
        }

        /* ---------------- SLOT LOCK CHECK ---------------- */
        const existingAppointment = await Appointment.findOne({
            mentorId: mentorProfileId,
            slot: slotDateTime,
        }).session(session);

        if (existingAppointment) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Mentor already booked for this slot",
            });
        }

        /* ---------------- PAYMENT VERIFICATION ---------------- */
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = paymentDetails;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        /* ---------------- UPDATE PAYMENT ---------------- */
        const paymentData = await PaymentDetails.findOneAndUpdate(
            { razorpay_order_id, status: { $ne: "Complete" } },
            {
                razorpay_payment_id,
                razorpay_signature,
                status: "Complete",
            },
            { new: true, session }
        );

        if (!paymentData) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "Payment record not found or already processed",
            });
        }

        /* ---------------- IDEMPOTENCY CHECK ---------------- */
        const existingBooking = await Appointment.findOne({
            paymentDetails: paymentData._id,
        }).session(session);

        if (existingBooking) {
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({
                success: true,
                message: "Appointment already booked",
                slip: existingBooking,
            });
        }


        /* ---------------- CREATE APPOINTMENT ---------------- */
        const appointment = await Appointment.create(
            [
                {
                    userId: userProfileId,
                    mentorId: mentorProfileId,
                    slot: slotDateTime,
                    roomNo: userProfileId.toString(),
                    paymentDetails: paymentData._id,
                    status: "SCHEDULED",
                },
            ],
            { session }
        );


        /* ---------------- COMMIT ---------------- */
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Appointment booked successfully",
            slip: appointment[0],
        });

    } catch (error) {
        /* ---------------- ROLLBACK ---------------- */
        await session.abortTransaction();
        session.endSession();

        console.error("Transaction Failed:", error);

        return res.status(500).json({
            success: false,
            message: "Booking failed. Payment will be refunded if required.",
        });
    }
};



exports.myBooking = async (req, res) => {
    try {
        const userId = req.user._id;

        const userProfile = await UserProfile.findOne({ user: userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }


        const myBookings = await Appointment.find({
            userId: userProfile._id,
        })
            .populate("mentorId", "name title profilePic")
            .sort({ slot: -1 });


        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            myBookings,
        });

    } catch (error) {
        console.error("myBooking Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching bookings",
        });
    }
};


exports.myAppointment = async (req, res) => {
    try {
        const userId = req.user._id;

        const mentorProfile = await MentorProfile.findOne({ user: userId });
        if (!mentorProfile) {
            return res.status(404).json({
                success: false,
                message: "Mentor profile not found",
            });
        }

        const myAppointments = await Appointment.find({
            mentorId: mentorProfile._id,
        })
            .populate("userId", "profilePic name phoneNo aboutSection")
            .sort({ slot: -1 });

        return res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            appointments: myAppointments,
        });

    } catch (error) {
        console.error("myAppointment Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching appointments",
        });
    }
};


exports.updateStatusAppointment = async (req, res) => {
    try {
        const { bookId, status } = req.body;
        if (!bookId || !status) {
            return res.status(400).json({
                success: false,
                message: 'All field are required!!'
            })
        }

        const updatedslip = await Appointment.findByIdAndUpdate(bookId, { status: status }, { new: true });

        if (!updatedslip) {
            return res.status(404).json({
                success: false,
                message: 'Appointment fail to update status!!'
            });
        }
        res.status(200).json({
            success: true,
            message: 'status updated successfully',
            updatedslip: updatedslip

        })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'in aproveAppointment Server error',
        })
    }
}


exports.paymentSlip = async (req, res) => {
  try {
    const { razorpay_payment_id } = req.params;

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "razorpay_payment_id is required",
      });
    }

    /* ---------------- PAYMENT ---------------- */
    const paymentDetails = await PaymentDetails.findOne({
      razorpay_payment_id,
      status: "Complete",
    });

    if (!paymentDetails) {
      return res.status(404).json({
        success: false,
        message: "Payment details not found",
      });
    }

    /* ---------------- APPOINTMENT ---------------- */
    const appointment = await Appointment.findOne({
      paymentDetails: paymentDetails._id,
    })
      .populate("userId", "name phone profilePic")
      .populate("mentorId", "name title profilePic");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found for this payment",
      });
    }

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      success: true,
      message: "Payment slip fetched successfully",
      slip: {
        paymentId: paymentDetails._id,
        amount: paymentDetails.amount,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id,

        user: {
          name: appointment.userId.name,
          phone: appointment.userId.phone,
          profilePic: appointment.userId.profilePic,
        },

        mentor: {
          name: appointment.mentorId.name,
          title: appointment.mentorId.title,
          profilePic: appointment.mentorId.profilePic,
        },

        slot: appointment.slot,
        status: appointment.status,
        roomNo: appointment.roomNo,
        createdAt: appointment.createdAt,
      },
    });

  } catch (error) {
    console.error("paymentSlip Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating payment slip",
    });
  }
};



exports.slotIsAvailable = async (req, res) => {
  try {
    const { mentorId, slot } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!mentorId || !slot) {
      return res.status(400).json({
        success: false,
        message: "mentorId and slot are required",
      });
    }

    const slotDateTime = convertToDateTime(slot);
    if (!slotDateTime) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot format",
      });
    }

    /* ---------------- CHECK MENTOR ---------------- */
    const mentorExists = await MentorProfile.exists({ _id: mentorId });
    if (!mentorExists) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    /* ---------------- SLOT CHECK ---------------- */
    const existingAppointment = await Appointment.findOne({
      mentorId,
      slot: slotDateTime,
      status: { $ne: "CANCELLED" },
    });

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      success: true,
      isAvailable: !existingAppointment,
      message: existingAppointment
        ? "Slot is already booked"
        : "Slot is available",
    });

  } catch (error) {
    console.error("slotIsAvailable Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking slot availability",
      isAvailable: false,
    });
  }
};

