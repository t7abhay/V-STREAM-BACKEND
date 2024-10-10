
import { ApiResponse } from "../utilities/ApiResponse.js ";
import { asyncHandler } from "../utilities/asyncHandler.js ";

const healthCheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { message: "Service is up and running !" },
                "Healthy"
            )
        );
});

export { healthCheck };
