const express = require("express");
const PORT = 8080;
const app = express();

// SOCKET.IO
const server = require('http').createServer(app);
const { socketconnection } = require('./socketio/socketio_connection');

const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const session = require("express-session");
const morgan = require("morgan");
const logger = require("../middleware/winston");
const dotenv = require("dotenv");
dotenv.config();
const healthCheck = require("../middleware/healthCheck");
const verifyToken = require("../middleware/authentication");
const validator = require("../middleware/validator");
const Redis = require("./redis_client");



// ROUTES
const authRoutes = require("../routes/auth.routes");
const usersRoutes = require("../routes/user.routes");
const searchRoutes = require("../routes/search.routes");
const tweetsRoutes = require("../routes/tweets.routes");
const commentsRoutes = require("../routes/comments.routes");
const followerRoutes = require("../routes/followers.routes");
const bookmarksRoutes = require("../routes/bookmarks.routes");
const notificationRoutes = require("../routes/notification.routes");


try {
  mongoose.connect(process.env.MONGO_URI);
  logger.info("MongoDB Connected");
} catch (error) {
  logger.error("Error connecting to MongoDB" + error);
}
 (async function () {
  try {
    const redisClient = Redis.init();
    await redisClient.connect();
    logger.info("Redis Connected");
  } catch (error) {
    logger.error("Error connecting to Redis: " + error);
  }
})();


server.listen(process.env.SOCKETIO_PORT || 4000 , () => {
  logger.info('socket.io server is running on port 4000');
});
socketconnection(server);

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
    
    // Errors handling
    // app.use(errors.notFoundError);
    // app.use(errors.unauthorizedError);
    // app.use(errors.internalServerError);
    
    
    app.use(verifyToken);

    
    // Route registration
    app.use("/user", usersRoutes);
    app.use("/search", searchRoutes);
    app.use("/tweets", tweetsRoutes);
    app.use("/comments", commentsRoutes);
    app.use("/followers", followerRoutes);
    app.use("/bookmarks", bookmarksRoutes);
    app.use("/notifications", notificationRoutes);
    

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