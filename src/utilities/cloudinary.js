import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import sanitize from "sanitize-filename";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    const uploadOnCloudinary = async (localFilePath) => {
        let sanitizedLocalFilePath = sanitize(localFilePath);

        try {
            if (!sanitizedLocalFilePath) return null;

            const response = await cloudinary.uploader.upload(
                sanitizedLocalFilePath,
                { resource_type: "auto" }
            );

            // ✅ Check if file exists before deleting
            if (fs.existsSync(sanitizedLocalFilePath)) {
                fs.unlinkSync(sanitizedLocalFilePath);
            }

            return response;
        } catch (error) {
            // ✅ Check if file exists before deleting in case of error
            if (fs.existsSync(sanitizedLocalFilePath)) {
                fs.unlinkSync(sanitizedLocalFilePath);
            }

            console.error("Cloudinary Upload Error:", error);
            return null;
        }
    };

};


const deleteOnCloudinary = async (public_id, resource_type = "image") => {
    try {
        if (!public_id) return null;

        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`,
        });
    } catch (error) {
        console.error(error);
        return error;
    }
};

export { uploadOnCloudinary, deleteOnCloudinary };
