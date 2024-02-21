import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: CLOUDINARY_API_SECRET,
});

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
   cloud_name: "dgjpsgqd9",
   api_key: "391137236965236",
   api_secret: "_sSeK75aqH7Tk5k-NNgYIy4I8iY",
});

const uploadOnCloudinary = async (localFilePath) => {
   try {
      if (!localFilePath) return null;

      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto",
      });
      console.log("File is uploaded on cloudinary", response.url);
      return response;
   } catch (error) {
      fs.unlinkSync(localFilePath); // remove locally saved temporary file
      return null;
   }
};


export {uploadOnCloudinary}