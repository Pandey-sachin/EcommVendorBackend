const { driver } = require('../models/neo4j');
const neo4j = require('neo4j-driver');

const { v4: uuidv4 } = require('uuid'); 

const convertAndValidateProductInput = (input) => {
    let { pname, price, discount, images, quantity, category, vendorId,description } = input;

    // Convert fields to appropriate types
    price = parseFloat(price);
    discount = parseInt(discount, 10);
    quantity = parseInt(quantity, 10);

    // Validate inputs
    const errors = [];
    if (!pname || typeof pname !== 'string' || pname.trim() === '') errors.push('Invalid product name');
    if (isNaN(price) || price <= 0) errors.push('Invalid price');
    if (isNaN(discount) || discount < 0) errors.push('Invalid discount');
    if (isNaN(quantity) || quantity <= 0) errors.push('Invalid quantity');
    if (!Array.isArray(images)) errors.push('At least one image URL is required');
    if (!category || typeof category !== 'string' || category.trim() === '') errors.push('Invalid category');
    if (!vendorId || typeof vendorId !== 'string' || vendorId.trim() === '') errors.push('Invalid vendor ID');

    return {
        valid: errors.length === 0,
        message: errors.join(', '),
        convertedInput: errors.length === 0 ? { pname, price, discount, images, quantity, category, vendorId,description } : null
    };
};
const addProduct = async (req, res) => {
    const session = driver.session();

    try {
        const validationResult = convertAndValidateProductInput(req.body);

        if (!validationResult.valid) {
            return res.status(400).json({ message: validationResult.message });
        }

        const { convertedInput } = validationResult;


        // Create the product
        const productId = uuidv4();
        const result = await session.run(
            `MATCH (v:User {userId: $vendorId, role: 'seller'})
             CREATE (p:Product {
                 productId: $productId,
                 pname: $pname,
                 price: $price,
                 discount: $discount,
                 images: $images,
                 quantity: $quantity,
                 category: $category,
                 description: $description
             })
             CREATE (v)-[:SELLS]->(p)
             RETURN p`,
            { ...convertedInput, productId }
        );

        const product = result.records[0].get('p').properties;

        res.status(201).json({
            message: 'Product added successfully',
            product: {
                ...product,
                vendorId: convertedInput.vendorId
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add product', error: error.message });
    } finally {
        await session.close();
    }
};
const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const session = driver.session();

    try {
        const validationResult = convertAndValidateProductInput(req.body);

        if (!validationResult.valid) {
            return res.status(400).json({ message: validationResult.message });
        }

        const { convertedInput } = validationResult;
        // Check if the vendor exists and has the 'seller' role
        const vendorResult = await session.run(
            `MATCH (v:User {userId: $vendorId, role: 'seller'}) RETURN v`,
            { vendorId: convertedInput.vendorId }
        );

        if (vendorResult.records.length === 0) {
            return res.status(404).json({ message: 'Vendor not found or invalid role' });
        }

        const result = await session.run(
            `MATCH (p:Product {productId: $productId})
             SET p.pname = $pname,
                 p.price = $price,
                 p.discount = $discount,
                 p.images = $images,
                 p.quantity = $quantity,
                 p.category = $category,
                 p.description = $description
             RETURN p`,
            {
                ...convertedInput,productId
            }
        );
        

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const updatedProduct = result.records[0].get('p').properties;

        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    } finally {
        await session.close();
    }
};


const deleteProduct = async (req, res) => {
    const { productId } = req.params;
    const session = driver.session();

    try {
        const result = await session.run(
            `MATCH (p:Product {productId: $productId})
            DETACH DELETE p
            RETURN p`,
            { productId }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete product', error });
    } finally {
        await session.close();
    }
};
const deleteSelectedProduct = async (req, res) => {
    const { productIds } = req.body; 
    const session = driver.session();

    try {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input, productIds must be a non-empty array' });
        }


        const result = await session.run(
            `MATCH (p:Product)
            WHERE p.productId IN $productIds
            DETACH DELETE p
            RETURN p`,
            { productIds }
        );


        if (result.records.length === 0) {
            return res.status(404).json({ message: 'No products found with the provided IDs' });
        }

        res.status(200).json({ message: 'Products deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete selected products', error });
    } finally {
        await session.close();
    }
};


const getAllProducts = async (req, res) => {
    // const { page = 1, limit = 10 } = req.query; // Default to page 1, limit 10
    const session = driver.session();

    try {
        // const skip = (page - 1) * limit;

        const result = await session.run(
            `
            MATCH (p:Product)
            RETURN p
           `
        );
        const products = result.records.map(record => record.get('p').properties);
        

        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Failed to fetch products',
            error
        });
    } finally {
        await session.close();
    }
};

const getAllProductsByVendor = async (req, res) => {
    const { vendorId } = req.params; // Extract vendorId from route parameters
    // const { page = 1, limit = 10 } = req.query; // Default to page 1, limit 10
    const session = driver.session();

    try {
        
        // Run the Cypher query to fetch products for the given vendor
        const result = await session.run(
            `
            MATCH (v:User {userId: $vendorId})-[:SELLS]->(p:Product)
            RETURN p
           
            `,
            { vendorId } // Ensure integers are passed
        );

        // Extract product properties from the result
        const products = result.records.map(record => record.get('p').properties);

        // Return the response with pagination details
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    } finally {
        await session.close();
    }
};
module.exports = {addProduct, updateProduct, deleteProduct, getAllProducts, getAllProductsByVendor,deleteSelectedProduct}
