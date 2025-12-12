import express from 'express';
import * as productModel from '../../models/product.model.js';
import * as userModel from '../../models/user.model.js';
const router = express.Router();

router.get('/list', async (req, res) => {
    const products = await productModel.findAll();
    const success_message = req.session.success_message;
    const error_message = req.session.error_message;
    // Xóa message sau khi lấy ra
    delete req.session.success_message;
    delete req.session.error_message;
    const filteredProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        seller_name: p.seller_name,
        current_price: p.current_price,
        highest_bidder_name: p.highest_bidder_name
    }));
    res.render('vwAdmin/product/list', {
        products : filteredProducts,
        empty: products.length === 0,
        success_message,
        error_message
    });
});


router.get('/add', async (req, res) => {
    try {
        // Lấy danh sách sellers (users có role = 'seller')
        const sellers = await userModel.findUsersByRole('seller');
        res.render('vwAdmin/product/add', { sellers });
    } catch (error) {
        console.error('Error loading sellers:', error);
        res.render('vwAdmin/product/add', { 
            sellers: [],
            error_message: 'Failed to load sellers list'
        });
    }
});

router.post('/add', async (req, res) => {
    const newProduct = req.body;
    await productModel.createProduct(newProduct);
    req.session.success_message = 'Product added successfully!';
    res.redirect('/admin/product/list');
});
router.get('/detail/:id', async (req, res) => {
    const id = req.params.id;
    const product = await productModel.findByProductIdForAdmin(id);
    const success_message = req.session.success_message;
    const error_message = req.session.error_message;
    delete req.session.success_message;
    delete req.session.error_message
    res.render('vwAdmin/product/detail', { product } );
});

router.get('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const product = await productModel.findByProductIdForAdmin(id);
    const sellers = await userModel.findUsersByRole('seller');
    res.render('vwAdmin/product/edit', { product, sellers } );
});

router.post('/edit', async (req, res) => {
    const newProduct = req.body;
    await productModel.updateProduct(newProduct.id, newProduct);
    req.session.success_message = 'Product updated successfully!';
    res.redirect('/admin/product/list');
});
router.post('/delete', async (req, res) => {
    const { id } = req.body;
    await productModel.deleteProduct(id);
    req.session.success_message = 'Product deleted successfully!';
    res.redirect('/admin/product/list');
});
export default router;