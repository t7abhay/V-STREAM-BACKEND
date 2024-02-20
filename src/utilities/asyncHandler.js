const asyncHandler = (reqHandler) => {
  (res, req, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};
export { asyncHandler };
