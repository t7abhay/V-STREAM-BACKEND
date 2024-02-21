import { response } from "express";
import { asyncHandler } from "../utilities/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
   res.status(200).json({
      message: "This is working 😁",
   });
});

export { registerUser };
