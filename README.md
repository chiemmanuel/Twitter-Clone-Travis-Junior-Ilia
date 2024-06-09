# Twitter-Clone-Travis-Junior-Ilia

## Project Description
 This is our Twitter Clone project developed by Travis, Junior and Ilia. The project is a Twitter clone that allows users to perform all basic functions of Twitter, such as creating a tweet, following other users, liking tweets, retweeting, commenting, bookmarking tweets, viewing both live and custom feeds, searching for users or tweets, and viewing user profiles. The project is built using NodeJs, Express, React, Socket.io, MongoDB, Neo4j, and Redis. 

 ## Database Use Cases
 
**MongoDB**:
MongoDB is used to store our user-generated content such as tweets, comments, and notifactions. 
This allows us to store large amounts of data and scale horizontally as our user base grows. 
The schemas for MongoDB are defined in `/back/models/` 
Queries to MongoDB are made using Mongoose in the `/back/services/` folder.

**Neo4j**:
Neo4j is used to store our user data such as followers, following, and user relationships. 
This allows us to easily query and traverse the graph to find relationships between users and their content interactions. 
The queries to Neo4j are made using the `neo4j-driver` package in the `/back/services/` folder.

**Redis**:
Redis is used to store our user sessions and cache frequently accessed data. 
We used a cache-aside implementation, allowing for quick access to commonly requested data and reducing the load on our MongoDB and Neo4j databases. 
The queries to Redis are made using the Redis client defined in the `/back/boot/redis_client.js` file.
The caching logic is implemented in the `/back/services/` folder.

## How to run the project
1. Clone the repository or download and extract the zip file
2. Run `npm install` in the `/back` directory to install the dependencies for the backend
3. Run `npm install` in the `/front` directory to install the dependencies for the frontend
3. Ensure all environment variables are set in the `.env` file in the `/back` directory, as shown in the `.env.template` file
4. Have MongoDB, Neo4j, and Redis running on your local machine, or update the connection strings in the `.env` file to point to your database instances.
5. Run `npm start` in the `/back` directory to start the backend server
6. Run `npm start` in the `/front` directory to start the frontend server
7. Open your browser and navigate to `http://localhost:3000` to view the application or use Postman to test the API endpoints (https://speeding-shuttle-145414.postman.co/workspace/New-Team-Workspace~9bbc6a62-0def-40d9-bad3-56959c01b44b/collection/32573845-4634dfc1-a3bb-4c1c-b204-dfc998a413d0?action=share&creator=32573845&active-environment=32573845-38dc3580-3f17-4b4d-a200-cf48c6470bb8)



