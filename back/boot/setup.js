const express = require("express");
const PORT = 8080;
const app = express();

const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const session = require("express-session");
const morgan = require("morgan");
const logger = require("../middleware/winston");
const notFound = require("../middleware/notFound");
const healthCheck = require("../middleware/healthCheck");
const verifyToken = require("../middleware/authentication");
const validator = require("../middleware/validator");

// ROUTES
const tweetsRoutes = require("../routes/tweets.routes");
const authRoutes = require("../routes/auth.routes");
const usersRoutes = require("../routes/user.routes");
const commentsRoutes = require("../routes/comment.routes");

try {
  mongoose.connect("mongodb://localhost:27017/twitter-clone");
  logger.info("MongoDB Connected");
} catch (error) {
  logger.error("Error connecting to MongoDB" + error);
}

// MIDDLEWARE
const registerCoreMiddleWare = async () => {
  try {
    // using our session
    app.use(
      session({
        secret: "1234",
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: false,
          httpOnly: true,
        },
      })
    );

    app.use(morgan("combined", { stream: logger.stream }));
    app.use(express.json()); // returning middleware that only parses Json
    app.use(cors({})); // enabling CORS
    app.use(helmet()); // enabling helmet -> setting response headers

    app.use(validator);
    app.use(healthCheck);
    app.use("/auth", authRoutes);
    
    

    app.use(verifyToken);

    // Route registration
    app.use("/user", usersRoutes);
    app.use("/tweets", tweetsRoutes);
    app.use("/comments", commentsRoutes);

    // 404 handling for not found
    app.use(notFound);

    logger.http("Done registering all middlewares");
  } catch (err) {
    logger.error("Error thrown while executing registerCoreMiddleWare");
    process.exit(1);
  }
};

// handling uncaught exceptions
const handleError = () => {
  // 'process' is a built it object in nodejs
  // if uncaught exceptoin, then we execute this
  //
  process.on("uncaughtException", (err) => {
    logger.error(`UNCAUGHT_EXCEPTION OCCURED : ${JSON.stringify(err.stack)}`);
  });
};

// start applicatoin
const startApp = async () => {
  try {
    // register core application level middleware
    await registerCoreMiddleWare();

    app.listen(PORT, () => {
      logger.info("Listening on 127.0.0.1:" + PORT);
    });

    // exit on uncaught exception
    handleError();
  } catch (err) {
    logger.error(
      `startup :: Error while booting the applicaiton ${JSON.stringify(
        err,
        undefined,
        2
      )}`
    );
    throw err;
  }
};

module.exports = { startApp };