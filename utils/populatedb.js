//Run this file to populate data in the database to run <node populatedb.js>
//Run this file only once
const { createUser } = require('../controllers/userController'); 
const { addProduct } = require('../controllers/productController'); 
const { driver } = require('../models/neo4j'); // Neo4j driver


const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys'];

const mockResponse = () => {
    const res = {};
    res.status = (status) => {
        res.statusCode = status;
        return res;
    };
    res.json = (data) => {
        console.log(`Response [${res.statusCode}]:`, data);
        return res;
    };
    return res;
};

const populateDatabase = async () => {
    const users = [
        { username: 'user1', email: 'user1@example.com', password: 'password123', role: 'user' },
        { username: 'user2', email: 'user2@example.com', password: 'password456', role: 'user' },
        { username: 'seller1', email: 'seller1@example.com', password: 'password789', role: 'seller' },
        { username: 'seller2', email: 'seller2@example.com', password: 'password321', role: 'seller' },
        { username: 'seller3', email: 'seller3@example.com', password: 'password654', role: 'seller' },
    ];

    const session = driver.session();

    try {
        console.log('Creating users...');
        for (const user of users) {
            const req = { body: user };
            const res = mockResponse();
            await createUser(req, res);
        }
        console.log('Users created successfully.');

        console.log('Fetching sellers...');
        const sellerIdsQuery = await session.run(
            `MATCH (s:User {role: 'seller'}) RETURN s.userId AS sellerId`
        );

        const sellerIds = sellerIdsQuery.records.map((record) => record.get('sellerId'));
        if (sellerIds.length === 0) {
            console.log('No sellers found. Cannot create products.');
            return;
        }

        console.log('Creating products...');
        for (let i = 1; i <= 20; i++) {
            const product = {
                pname: `Product ${i}`,
                price: (Math.random() * 100 + 1).toFixed(2), // Random price between 1 and 100
                discount: Math.floor(Math.random() * 30), // Random discount between 0 and 30
                quantity: Math.floor(Math.random() * 100) + 1, // Random quantity between 1 and 100
                category: categories[Math.floor(Math.random() * categories.length)],
                images: ["https://via.placeholder.com/1501","https://via.placeholder.com/1501"],
                vendorId: sellerIds[Math.floor(Math.random() * sellerIds.length)], // Random seller
                description : `Description of the Product ${i}`
            };

            const req = { body: product };
            const res = mockResponse();
            await addProduct(req, res);
        }
        console.log('Products created successfully.');
    } catch (error) {
        console.error('Error populating database:', error);
    } finally {
        await session.close();
        console.log('Database population complete.');
    }
};

populateDatabase();
