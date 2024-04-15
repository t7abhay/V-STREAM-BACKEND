const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err)
        );
    };
};

export { asyncHandler };

/* 
- asyncHandler - higher order function which takes reqHandler function as its argument
-this asyncHandler returns another function that takes res,req,next as its arguments
- Within the returned function there is Promise which if resolved returns our reqHandler function with res,req,next as arguments gets executed (if promise is resolved then everything works good)


- if there is an error while executing the reqHandler function then it will be caught and the next(error) will pass that error to our custom error class ApiError(error)

*/
