const { time } = require('console');
const mongoose = require('mongoose');

const MentorProfileSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
    },
    name: {
        type: String,
    },
    title: {
        type: String, 
    },
    dob: {
        type: Date,  // Changed to Date type for proper date handling
    },
    areaOfExpertise: [{
        type: String,
    }],
    yearsOfExperience: {
        type: Number,  // Allows decimal values like 2.5
    },
    address: {
        type: String,
    },
    skills: [{
        type: String,
    }],
    language: [{
        type: String,
    }],
    aboutSection: {
        type: String,
    },
    profilePic: {
        type: String,  // Optional field
        default: null,
    },
    achievements: [{
        type: String,
    }],
    socialMediaLinks: {
        linkedin: { type: String },
        twitter: { type: String },
        github: { type: String },
        email: { type: String },
    },
    perHourcharge: {
        type: Number,
    },
    phone: {
        type: String,  // Add phone number field
    },
    category: {
        type: String,  // Add category field (e.g., 'Technical', 'Business');
    },
    reviewrating: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReviewRating',  // Reference the ReviewRating model
    }],
    timePreferences: {
        startWeekDay:{
            type:String,  //mondey
            required:true
        },
        endWeekDay:{
            type:String,  //friday
            required:true
        },
        dayStartTime:{
            type:String,  // HH:MM
            required:true,
        },
        dayEndTime:{
            type:String,
            required:true,
        },
    }
}, { timestamps: true });  

const MentorProfile = mongoose.model('MentorProfile', MentorProfileSchema);
module.exports = MentorProfile;
