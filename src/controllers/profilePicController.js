const MentorProfile = require('../models/MentorProfile.model');
const UserProfile = require('../models/UserProfile.model');
const imageUpload = require('../utils/imageUpload');
const User = require('../models/User.model');

// Update profilePic based on user role
exports.updateProfilePic = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }   
        if(!req.files){
            console.log("file not found");
            return res.status(404).json({ message: 'file not found', success: false });
        }
        let updatedProfile;

        if (user.role === 'MENTOR') {
            let mentorProfile = await MentorProfile.findById(user.mentorProfile);
            if (!mentorProfile) {
                mentorProfile = new MentorProfile({
                    user: user._id,
                    profilePic: null, 
                });
                await mentorProfile.save();

                user.mentorProfile = mentorProfile._id;
                await user.save();
            }

            if (req.files) {
                const profilePic = await imageUpload.imageUpload(req, mentorProfile.profilePic);
                mentorProfile.profilePic = profilePic;
            }

            updatedProfile = await mentorProfile.save();

        } else if (user.role === 'USER') {
            let userProfile = await UserProfile.findOne({ user: user._id });;
            if (!userProfile) {
                userProfile = new UserProfile({
                    user: user._id,
                    name: user.fullname ? `${user.fullname.firstname} ${user.fullname.lastname}` : '',
                    email: user.email,
                    profilePic: null, 
                });
                await userProfile.save();

                user.userProfile = userProfile._id;
                await user.save();
            }

            if (req.files) {
                const profilePic = await imageUpload.imageUpload(req, userProfile.profilePic);
                userProfile.profilePic = profilePic;
            }
            updatedProfile = await userProfile.save();
        } else {
            return res.status(400).json({ success: false, message: "Invalid user role" });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            profile: updatedProfile,
        });

    } catch (error) {
        console.error("Error in updateProfilePic:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
