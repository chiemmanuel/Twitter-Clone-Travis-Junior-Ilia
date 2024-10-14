const { set } = require('mongoose');
const { createClient } = require('redis'); 
require('dotenv').config();

class Redis {
  static instance;
  static client;

  
  init() {
    const connectToRedis = () => {
      const maxRetries = 5;
      Redis.client = createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > maxRetries) {
              return Error(`Redis connection failed after ${maxRetries} retries`);
            }
            console.log(`Retrying redis connection - retry #${retries}`);
            return 1000 * retries;
          }
        }

      });
    }
    console.log('Creating Redis client');
    connectToRedis();
    Redis.client.on('connect', () => console.log('Redis Client Connected'));
    Redis.client.on('error', err => {
      console.log('Redis Client Error', err)
    });
    return Redis.client;
  }

  static getInstance() {
    if (!Redis.instance) Redis.instance = new Redis();
    return Redis.instance;
  }

  getRedisClient() {
    return Redis.client;
  }
}

module.exports = Redis.getInstance();