const express = require('express');
const { 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    getAllProducts, 
    getAllProductsByVendor,
    deleteSelectedProduct
} = require('../controllers/productController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();


router.get('/', getAllProducts);
router.get('/:vendorId',authenticate, getAllProductsByVendor);
router.post('/',authenticate, addProduct);
router.put('/:productId',authenticate, updateProduct);
router.delete('/:productId',authenticate, deleteProduct);
router.post('/delete',authenticate,deleteSelectedProduct)

module.exports = router;

