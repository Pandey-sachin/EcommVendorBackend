const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const { driver } = require('../models/neo4j');

const authenticateUser = async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const session = driver.session();

    try {
        const result = await session.run(
            `MATCH (u:User {email: $email}) RETURN u.password AS hashedPassword, u.userId AS id, u.username AS username, u.role AS role`,
            { email }
        );
        
        if (!result.records.length) return res.status(404).json({ message: 'User not found' });
        
        const { hashedPassword, id, username, role } = result.records[0].toObject();
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const maxAge = process.env.TOKEN_EXPIRATION
                        ? parseInt(process.env.TOKEN_EXPIRATION, 10) * 1000 // Convert seconds to milliseconds
                        : 3600 * 1000;
        
        const token = generateToken({ id, username, role }, { expiresIn: `${maxAge}s` });

        // Securely set the token in the response cookie
        res.cookie('jwtToken', token, {
            httpOnly: true,  // Prevents JavaScript access
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict', // Prevents CSRF
            maxAge: maxAge, 
        });

        // Return the user object along with the token
        res.status(200).json({
            message: 'Authentication successful',
            token,
            user: {
                id,
                username,
                email,
                role,
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Authentication failed', error: error.message });
    } finally {
        await session.close();
    }
};

const signOut = (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('jwtToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            expires: new Date(0),
        });

        // Send a success response
        res.status(200).json({
            message: 'Successfully signed out',
        });
    } catch (error) {
        console.error('Error during sign out:', error);
        res.status(500).json({
            message: 'Failed to sign out. Please try again.',
        });
    }
};


module.exports = { authenticateUser ,signOut};
