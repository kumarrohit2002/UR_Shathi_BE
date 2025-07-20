const cloudinary = require('cloudinary').v2;

// Function to check if a file type is supported
function isFileTypeSupported(fileType, supportedTypes) {
    return supportedTypes.includes(fileType);
}

// Function to upload a file to Cloudinary
async function uploadFileToCloudinary(file, folder, resourceType, quality = 70) {
    const options = { folder, resource_type: resourceType };
    if (resourceType === 'image') {
        options.quality = quality; // Quality setting for images
    }
    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

// Function to delete a file from Cloudinary
async function deleteFileFromCloudinary(fileUrl, resourceType) {
    try {
        if (!fileUrl) return;

        const publicId = fileUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`fileUploadFolder/${publicId}`, { resource_type: resourceType });
    } catch (error) {
        console.log(`Error deleting ${resourceType} from Cloudinary: `, error.message);
    }
}

// Controller function for image upload
async function imageUpload(req, existingImageUrl) {
    try { 
        if (!req.files || !req.files.imageFile) {
            throw new Error("No image file provided.");
        }

        const file = req.files.imageFile;
        const supportedTypes = ["jpg", "jpeg", "png"];
        const fileType = file.name.split('.').pop().toLowerCase();

        if (!isFileTypeSupported(fileType, supportedTypes)) {
            throw new Error("Image format not supported.");
        }

        if (existingImageUrl) {
            await deleteFileFromCloudinary(existingImageUrl, 'image');
        }

        const response = await uploadFileToCloudinary(file, "fileUploadFolder", 'image', 70);
        return response.secure_url;

    } catch (error) {
        throw new Error("Error in imageUpload: " + error.message);
    }
}

// Controller function for PDF upload
async function pdfUpload(req, existingPdfUrl) {
    try {
        if (!req.files || !req.files.pdfFile) {
            throw new Error("No PDF file provided.");
        }

        const file = req.files.pdfFile;
        const supportedTypes = ["pdf"];
        const fileType = file.name.split('.').pop().toLowerCase();

        if (!isFileTypeSupported(fileType, supportedTypes)) {
            throw new Error("PDF format not supported.");
        }

        if (existingPdfUrl) {
            await deleteFileFromCloudinary(existingPdfUrl, 'raw');
        }

        const response = await uploadFileToCloudinary(file, "fileUploadFolder", 'raw');
        return response.secure_url;

    } catch (error) {
        throw new Error("Error in pdfUpload: " + error.message);
    }
}

// Exporting both imageUpload and pdfUpload functions
module.exports = {
    imageUpload,
    pdfUpload
};
