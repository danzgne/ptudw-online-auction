import express from 'express';
import * as productModel from '../models/product.model.js';

const router = express.Router();

router.get('/category/:id', async (req, res) => {
  const categoryId = req.params.id;
  const products = await productModel.findByCategoryId(categoryId);
  res.render('vwProduct/list', { products });
});
router.get('/search', async (req, res) => {
  // const q = req.query.q || '';
  // const products = await productModel.findBySearch(q);
  // res.render('vwProduct/bySearch', { products, searchQuery: q });
  const products = await productModel.findAll();
  res.render('vwProduct/new_list', {products: products});  
});


export default router;