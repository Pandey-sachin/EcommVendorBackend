require('dotenv').config();
const neo4j = require('neo4j-driver');
const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

// Validate required environment variables
if (!uri || !user || !password) {
    throw new Error('Missing Neo4j environment variables. Ensure NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD are set.');
}
// Create Neo4j driver instance with configuration
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
});

const checkConnection = async () => {
    try {
        const serverInfo = await driver.getServerInfo();
        console.log('Server Info:', serverInfo);
    } catch (error) {
        console.error('Failed to retrieve server info:', error);
    }
};

// Function to close the Neo4j driver
const closeDriver = async () => {
    try {
        await driver.close();
        console.log('Neo4j driver closed successfully.');
    } catch (error) {
        console.error('Error closing Neo4j driver:', error);
    }
};

module.exports = { driver, checkConnection,closeDriver };
