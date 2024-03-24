const asyncHandler = (reqHandler) => {

  return (res, req, next) => {
    Promise.resolve(reqHandler(res, req, next))
    .catch((err) => next(err));
  }
};
export { asyncHandler };
