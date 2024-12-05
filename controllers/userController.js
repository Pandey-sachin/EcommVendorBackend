const bcrypt = require('bcrypt');
const { driver } = require('../models/neo4j');
const { v4: uuidv4 } = require('uuid');
const createUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    const session = driver.session();

    try {
        
        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ message: 'Invalid username' });
        }
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        if (!role || !['user', 'admin', 'seller'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if email is already in use
        const emailCheckResult = await session.run(
            `MATCH (u:User {email: $email}) RETURN u`,
            { email }
        );

        if (emailCheckResult.records.length > 0) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        // Create the user in the database
        await session.run(
            `
            CREATE (u:User {
                userId: $userId,
                username: $username,
                email: $email,
                password: $hashedPassword,
                role: $role
            })
            `,
            {userId, username, email, hashedPassword, role }
        );

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    } finally {
        await session.close();
    }
};

module.exports = { createUser };
