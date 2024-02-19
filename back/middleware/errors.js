const notFoundError = (req, res, next) => {

  if (res.status === 404) {

  }   
  const error = new Error("Not Found");
  res.status(404).json({
    error: {
      message: error.message,
    },
  });
};

const unauthorizedError = (req, res, next) => {
  const error = new Error("Unauthorized");
  res.status(401).json({
    error: {
      message: error.message,
    },
  });
};

const internalServerError = (req, res, next) => {
  const error = new Error("Internal Server Error");
  res.status(500).json({
    error: {
      message: error.message,
    },
  });
};

module.exports = {
  notFoundError,
  unauthorizedError,
  internalServerError,
};
