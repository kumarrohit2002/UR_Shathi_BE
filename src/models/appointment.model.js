const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile',
        required: true,
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorProfile',
        required: true,
    },
    slot: {
        type: Date,
        required: true,
    },
    roomNo: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Join', 'Done'],
        default: 'Scheduled',
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;
