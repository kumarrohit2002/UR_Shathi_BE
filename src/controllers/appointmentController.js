const Appointment = require('../models/appointment.model');
const MentorProfile = require('../models/MentorProfile.model');
const UserProfile = require('../models/UserProfile.model');
const PaymentDetails = require('../models/PaymentDetails.model');

function convertToDateTime(dateTimeString) {
    const [datePart, timePart] = dateTimeString.split(" ");
    const fullDateTimeString = `${datePart} ${timePart}`;
    const date = new Date(fullDateTimeString);
    return isNaN(date) ? null : date;
}

exports.BookAppointment = async (req, res) => {
    try {
        // payment iid
        // file append
        // google sheet append
    
        const userId = req.user._id;
        const userprofile = await UserProfile.findOne({user: userId});
        if(!userprofile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }
        let { mentorProfile, slot,paymentDetails } = req.body;
        const mentorProfileId = mentorProfile._id;
        const userProfileId=userprofile._id;
        

        // Convert slot to DateTime
        slot = convertToDateTime(slot);

        // Validate that all required fields are present
        if (!mentorProfileId || !userProfileId || !slot ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required for booking'
            });
        }

        // Check if the mentor is already booked for this slot
        const existingAppointment = await Appointment.findOne({
            mentor: mentorProfileId,
            slot: slot
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'Mentor is already booked for this slot.'
            });
        }

        // Check if the user has already booked an appointment with the same mentor at this time
        const existingUserAppointment = await Appointment.findOne({
            userId: userProfileId,
            mentorId: mentorProfileId,
            slot: slot
        });

        if (existingUserAppointment) {
            return res.status(400).json({
                success: false,
                message: 'You have already booked an appointment with this mentor at this time.'
            });
        }


        const paymentData=await PaymentDetails.findOneAndUpdate({razorpay_order_id:paymentDetails.razorpay_order_id},paymentDetails);
        if (!paymentData) {
            return res.status(404).json({   
                success: false,
                message: 'Payment details not found'
            });
        }
        
        // Create a new appointment if no existing appointment is found
        const slip = await Appointment.create({
            userId: userProfileId,
            mentorId: mentorProfileId,
            roomNo: userProfileId, 
            slot,
            paymentDetails:paymentData._id,
        });

        res.status(200).json({
            success: true,
            message: 'Appointment request successful',
            slip: slip
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.myBooking = async (req, res) => {   // for user
    try {

        const userId = req.user._id;
        const userprofile = await UserProfile.findOne({user: userId});
        // Fetch the user's bookings
        console.log(userId);
        const myBookings = await Appointment.find({ userId: userprofile._id }).populate('mentorId', 'name title profilePic');;

        if (!myBookings || myBookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No bookings found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fetched bookings successfully',
            myBookings: myBookings, 
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

exports.myAppointment = async (req, res) => {   //for mentor
    try {
        const userId = req.user._id;
        const mentorProfileId=await MentorProfile.findOne({user: userId});

        console.log('Mentor Profile ID:', mentorProfileId);

        // Fetch appointments associated with the mentor profile
        const myAppointments = await Appointment.find({ mentorId: mentorProfileId })
            .populate('userId', 'profilePic name phoneNo aboutSection '); // Populate user data
        if (!myAppointments || myAppointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No appointments found for this mentor',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fetched appointments successfully',
            appointments: myAppointments, // Return the list of appointments with populated user data
        });

    } catch (error) {
        console.error('Error fetching appointments:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

exports.updateStatusAppointment=async(req,res)=>{
    try{
        const {bookId,status}=req.body;
        if(!bookId || !status){
            return res.status(400).json({
                success: false,
                message: 'All field are required!!'
            })
        }

        const updatedslip = await Appointment.findByIdAndUpdate(bookId,{status:status},{ new: true });

        if (!updatedslip) {
            return res.status(404).json({
                success: false,
                message: 'Appointment fail to update status!!'
            });
        }
        res.status(200).json({
            success: false,
            message:'status updated successfully',
            updatedslip:updatedslip

        })

    }catch(error){
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'in aproveAppointment Server error',
        })
    }
}
