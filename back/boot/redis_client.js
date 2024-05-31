const { createClient } = require('redis'); 
require('dotenv').config();

class Redis {
  static instance;
  static client;

  init() {
    console.log('Creating Redis client');
    Redis.client = createClient({
      password: process.env.REDIS_PASSWORD,
    })
    Redis.client.on('connect', () => console.log('Redis Client Connected'));
    Redis.client.on('error', err => console.log('Redis Client Error', err));
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