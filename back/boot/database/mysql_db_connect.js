const mysql = require('mysql2');
const logger = require('../../middleware/winston');
const { cli } = require('winston/lib/winston/config');

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

function startConnection() {
    connection = new mysql.createPool(db_config);
    connection.getConnection(function(err) {
        if (err) {
            logger.error('error when connecting to db:', err);
            setTimeout(startConnection, 2000);
        }
        logger.info('Connected to MySQL');
    });

    connection.on("error", (err, client) => {
        logger.error("Error in MySQL: ", err);
        startConnection();
    });
}

startConnection();

setInterval(function () {
    connection.query("SELECT 1", (err, res) => {
        if (err) logger.error("SELECT 1", err.sqlMessage);
    });
}, 5000);

module.exports = connection;