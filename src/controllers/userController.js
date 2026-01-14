const UserProfile = require('../models/UserProfile.model');
const MentorProfile = require('../models/MentorProfile.model');

// Create or update userProfile
exports.createUserProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized! User not found.",
            });
        }
        const { name, email, phoneNo, address, aboutSection } = req.body;

        if (!name || !email || !phoneNo || !address || !aboutSection) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required!',
            });
        }

        let userProfile = await UserProfile.findOne({ user: user._id });

        if (userProfile) {
            // Update existing profile
            userProfile.name = name;
            userProfile.email = email;
            userProfile.phoneNo = phoneNo;
            userProfile.address = address;
            userProfile.aboutSection = aboutSection;

            await userProfile.save();

            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully!',
                userProfile,
            });
        } else {
            userProfile = new UserProfile({
                user: user._id,  
                name,
                email,
                phoneNo,
                address,
                aboutSection,
            });

            await userProfile.save();

            user.userProfile = userProfile._id;
            

            return res.status(201).json({
                success: true,
                message: 'Profile created successfully!',
                userProfile,
            });
        }
    } catch (error) {
        console.error("Error in createUserProfile:", error.message);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};


// Get User Profile Data
exports.getUserProfileData = async (req, res) => {
    try {
        const user = req.user;
        const userProfile=await UserProfile.findOne({user:user._id});

        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found!',
            });
        }

        res.status(200).json({
            success: true,
            message: 'User profile data retrieved successfully!',
            userProfile: userProfile,
        });

    } catch (error) {
        console.log("Error in getUserProfileData:"+error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// book appoitment
const Appointment=require('../models/appointment.model');

exports.bookAppoitment = async(req,res)=>{
    try{
        const userId=req.user._id;
        const {mentorId,slot,phNo}=req.body;
        if(!userId || !mentorId || !slot || !phNo){
            return res.status(402).json({
                success: false,
                message: 'All field are required'
            });
        }

        const appointmentData= await Appointment.create({
            user:userId,
            mentor:mentorId,
            slot:slot,
            roomNo:userId,
            status:'pendding',
            phNo:phNo
        })

        res.status(200).json({
            success:true,
            message:'Appointment to waiting for approve',
            appointmentData:appointmentData,
        })

    }catch(error){
        console.log(error.message);
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


// Change Appointment Slot
exports.changeAppointmentSlot = async (req, res) => {
    try {
        const { appointmentId, newSlot } = req.body;

        if (!appointmentId || !newSlot) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID and new slot are required'
            });
        }

        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Updating the appointment slot
        appointment.slot = newSlot;
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment slot updated successfully',
            updatedAppointment: appointment,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Get My Booking Appointments with Mentor's profilePic, name, and phNo
exports.getMyBookingAppointments = async (req, res) => {
    try {
        const userId = req.user._id;
        // Find the user's appointments and populate the mentor field
        const appointments = await Appointment.find({ user: userId })
            .populate({
                path: 'mentor', 
                select: 'name profilePic', // Selecting only the mentor's name and profilePic from MentorProfile
            });

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No appointments found',
            });
        }

        // Preparing a response to return the necessary information
        const appointmentDetails = appointments.map(appointment => {
            return {
                appointmentId: appointment._id,
                slot: appointment.slot,
                mentorName: appointment.mentor.name,
                mentorProfilePic: appointment.mentor.profilePic,
                mentorPhNo: appointment.phNo,
            };
        });

        res.status(200).json({
            success: true,
            appointments: appointmentDetails,
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};




//apply on job portal
const Job=require('../models/Job.model');
const {pdfUpload}=require('../utils/imageUpload');
const ApplayedJob=require('../models/ApplyedJob.model');

exports.applyOnJobPortal=async(req,res)=>{  //pending
    try{
        const userId=req.user._id;
        const {jobPortalId,mentorId,atsScore}=req.body;
        if(!userId || !jobPortalId || !atsScore || !mentorId){
            res.status(400).json({
                success: false,
                message: 'all field are Required!!'
            })
        }
        const resumeUrl=await pdfUpload(req);
        if(resumeUrl){
            res.status(400).json({
                success:false,
                message:'Error in resume upload',
            });
        }

        const applyedJob=await ApplayedJob.create({
            user:userId,
            jobProtal:jobPortalId,
            atsScores:atsScore,
            resume:resumeUrl,
            mentor:mentorId
        });

        res.status(200).json({
            success:true,
            message:'applayed job on portal successfully',
            applyedJob:applyedJob
        });

    }catch(error){
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


