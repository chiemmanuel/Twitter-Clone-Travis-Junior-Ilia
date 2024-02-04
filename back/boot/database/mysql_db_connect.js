const mysql = require('mysql2/promise');
const logger = require('../../middleware/winston');

const db_config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let connection; 

async function startConnection() {
    try {
        connection = mysql.createPool(db_config);
        await connection.getConnection();
        logger.info('Connected to MySQL');
    } catch (error) {
        logger.error('error when connecting to db:', error);
        setTimeout(startConnection, 2000);
    }
}

startConnection();

setInterval(async function () {
    try {
        await connection.query('SELECT 1');
    } catch (error) {
        logger.error('MySQL error: ', error);
        startConnection();
    }
}, 5000);

module.exports = connection;