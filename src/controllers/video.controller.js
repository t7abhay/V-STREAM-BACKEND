import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comments.model.js";
import {
   uploadOnCloudinary,
   deleteOnCloudinary,
} from "../utilities/cloudinary.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";

const getAllVideos = asyncHandler(async (req, res) => {
   // this fucntion gets videos based on parameters or options selected by the user
   // and these options available for query property

   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

   // search index
   // 'll titiles
   const pipelines = [];

   // based on index
   if (query) {
      pipelines.push({
         $search: {
            query: "search-index",
            path: ["titile", "description"],
         },
      });
   }

   // if user tries to seach video based on uploaded by a user example : pewdiepi

   //based on userid
   if (userId) {
      if (!isValidObjectId(userId)) {
         throw new ApiError(400, "Invalid username");
      }

      pipelines.push({
         $match: {
            owner: new mongoose.Types.ObjectId(userId),
         },
      });
   }
   //also we need check if we are only trying to fetch videos that are set to be public
   pipelines.push({ $match: { isPublished: true } });

   // based on sortBy(view,publishedDate(aka : createdAt),duration(can be found by cloudniary )) and sortType(ascending and descending)

   if (sortBy && sortType) {
      pipelines.push({
         $sort: {
            [sortBy]: sortType === "ascending" ? 1 : -1,
            // ! comeback later to check
            // it is like example : sortby upload date:
            /* 
               and then sorttype is applied, as they are not seperate independent fields
               they can be used together to evalvulate 
            
            */
         },
      });
   } else {
      pipelines.push({
         $sort: {
            createdAt: -1,
         },
      });
   }

   pipelines.push(
      {
         $looup: {
            from: "users",
            localField: "owner",
            foreginFiled: "_id", // user
            as: "ownerDetails",

            pipelines: [
               {
                  $poject: {
                     username: 1,
                     "avatar.url": 1,
                  },
               },
            ],
         },
      },
      {
         $unwind: "$ownerDetails",
      }
   );

   const videoAggregate = await Video.aggregate(pipelines);

   const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
   };

   const video = await Video.aggregatePaginate(videoAggregate,options)

   return res
   .status(200)
   .json(new ApiResponse(200,video,"Video fetched successfully"))

});

export { getAllVideos };
