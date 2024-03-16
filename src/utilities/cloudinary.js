import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove locally saved temporary file
        return null;
    }
};

// Instead of passing the thumbnailto delete, we actually passs its public id and the variable thumbnailToDelete actually stores the public id in the thumbnail which is differes from the newly set thumbnail's public id

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
