const MentorProfile = require('../models/MentorProfile.model');
const ReviewRating = require("../models/ReviewRating.model");

// Create or Update MentorProfile
exports.createOrUpdateMentorProfile = async (req, res) => {
    try {
        const user = req.user;
        const {
            name, title, dob, areaOfExpertise, yearsOfExperience, skills, aboutSection,
            achievements, socialMediaLinks, address, language, perHourcharge, 
            timePreferences, phone, category
        } = req.body;

        if (!name || !title || !yearsOfExperience || !skills || !aboutSection || !achievements || !socialMediaLinks ||
            !address || !areaOfExpertise || !language || !perHourcharge || !phone || !category || !timePreferences) {
                
            console.log("All field are required!!!!!");
            return res.status(400).json({
                success: false,
                message: "All fields are required!!",
            });
        }

        let mentorProfile;
        let message;

        if (user.mentorProfile) {
            // Update existing mentor profile
            mentorProfile = await MentorProfile.findByIdAndUpdate(
                user.mentorProfile,
                {
                    name, dob, title, areaOfExpertise, yearsOfExperience, skills,
                    aboutSection, achievements, socialMediaLinks, address, language,
                    perHourcharge, timePreferences, phone, category
                },
                { new: true, runValidators: true } // Ensures validation runs
            );
            message = 'Mentor profile updated successfully';
        } else {
            // Create a new mentor profile
            mentorProfile = await MentorProfile.create({
                user: user._id,
                name, dob, title, areaOfExpertise, yearsOfExperience, skills,
                aboutSection, achievements, socialMediaLinks, address, language,
                perHourcharge, timePreferences, phone, category
            });

            // Update user with mentor profile reference
            user.mentorProfile = mentorProfile._id;
            message = 'Mentor profile created successfully';
        }

        return res.status(200).json({
            success: true,
            message,
            profile: mentorProfile,
        });
    } catch (error) {
        console.error("Error in createOrUpdateMentorProfile:", error.message);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};


//Get mentor Profile
exports.getMentorProfile=async(req,res)=>{
    try{
        const mentorId=req.user._id;
        const mentorProfile=await MentorProfile.find({user:mentorId});
        // const mentorProfile=await MentorProfile.find();

        if(!mentorId || !mentorProfile){
            return res.status(400).json({
                success: false,
                message: 'Mentor ID or profile not found'
            })
        }

        res.status(200).json({
            success: true,
            message:'Mentor profile successfully fetch',
            mentorProfile:mentorProfile
        })


    }catch(error){
        console.log(error.message);
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

// Get all MentorProfiles
exports.getAllMentorProfiles = async (req, res) => {
    try {
        const mentorProfiles = await MentorProfile.find();
        return res.status(200).json({
            success: true,
            AllMentor: mentorProfiles,
        });
    } catch (error) {
        console.error("Error in getAllMentorProfiles:", error.message);
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};


// // Get all MentorProfiles with average rating and number of reviews
// exports.getAllMentorProfiles = async (req, res) => {
//     try {
//         // Fetch all mentor profiles and populate the reviewRatings field with the actual review documents
//         const mentorProfiles = await MentorProfile.find().populate('reviewrating');

//         // Map through each mentor profile to calculate average rating and number of reviews
//         const mentorsWithRatings = mentorProfiles.map(mentor => {
//             const reviews = mentor.reviewrating;
//             const numberOfReviews = reviews.length;

//             // Calculate average rating if there are reviews
//             const averageRating = numberOfReviews > 0 
//                 ? (reviews.reduce((acc, review) => acc + review.rating, 0) / numberOfReviews).toFixed(2) 
//                 : 0;

//             return {
//                 ...mentor._doc, // Spread the original mentor profile details
//                 averageRating: parseFloat(averageRating), // Include the average rating
//                 numberOfReviews: numberOfReviews // Include the total number of reviews
//             };
//         });

//         return res.status(200).json({
//             success: true,
//             mentors: mentorsWithRatings,
//         });

//     } catch (error) {
//         console.error("Error in getAllMentorProfiles:", error.message);
//         res.status(500).json({
//             success: false,
//             message: `Error: ${error.message}`,
//         });
//     }
// };


exports.getMentorProfileById=async (req, res) => {
    try{
        const {Id}=req.body;
        const mentorProfile=await MentorProfile.findById(Id);

        res.status(200).json({
            success:true,
            message: `mentor about profile get successfully`,
            mentorProfile:mentorProfile
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        })
    }
}

//Search mentor basis of address or skills

exports.searchMentor = async (req, res) => {
    try {
        const { searchValue } = req.body;  
        const filter = {
            $or: [
                { name: { $regex: searchValue, $options: 'i' } },     
                { title: { $regex: searchValue, $options: 'i' } },     
                { category: { $regex: searchValue, $options: 'i' } },     
                { address: { $regex: searchValue, $options: 'i' } }, 
                { skills: { $elemMatch: { $regex: searchValue, $options: 'i' } } }  // Search within skills array
            ]
        };

        const mentors = await MentorProfile.find(filter);
        res.status(200).json({
            success: true,
            message: 'Search successful',
            searchMentors: mentors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error: ${error.message}`
        });
    }
};

const Job=require('../models/Job.model');

//post Job

exports.postJob = async (req, res) => {
    try {
        const mentorId = req.user._id;
        const {
            jobTitle, location, skillsRequired, typeOfWork, minSalary, maxSalary,
            lastDateToApply, minExperience, maxExperience, company
        } = req.body;

        console.log(req.body);

        // Validate all required fields
        if (!jobTitle || !mentorId || !location || !skillsRequired || !typeOfWork ||
            !minSalary || !maxSalary || !lastDateToApply || !minExperience || !maxExperience || !company) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required!'
            });
        }

        // Create job
        const postedJob = await Job.create({
            mentor: mentorId,
            company: company,
            jobTitle: jobTitle,
            location: location,
            Skillrequirements: skillsRequired,
            typeOfWork: typeOfWork,
            salarymin: minSalary,
            salarymax: maxSalary,
            lastdateToApply: lastDateToApply,
            experienceMin: minExperience,
            experienceMax: maxExperience,
        });

        // Respond with success
        return res.status(200).json({
            success: true,
            message: 'Job created successfully',
            postedJob: postedJob
        });

    } catch (error) {
        console.log(error.message);

        // Respond with error, ensure to return to stop further execution
        return res.status(500).json({
            success: false,
            message: error.message, // .message to avoid sending entire error object
        });
    }
};


exports.getAllPostJob=async(req, res)=>{
    try{
        const allpostedJobs=await Job.find();
        res.status(200).json({
            success:true,
            message: 'get all posted job successfully',
            AllPostedJob:allpostedJobs,
        })

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


