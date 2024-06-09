const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    'bolt://localhost:7687', 
    neo4j.auth.basic('neo4j', 'aroma-crown-door-phantom-delta-4480')
);

const createNeo4jSession = () => {
    return driver.session();
};

const toNeo4jId = (id) => {
    return neo4j.int(id);
};

module.exports = {
    createNeo4jSession,
    toNeo4jId,
}