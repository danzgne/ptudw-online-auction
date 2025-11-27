import express from 'express';
import * as productModel from '../models/product.model.js';

const router = express.Router();

router.get('/category', async (req, res) => {
  const categoryId = req.query.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const offset = (page - 1) * limit;
  
  const products = await productModel.findByCategoryId(categoryId, limit, offset);
  const total = await productModel.countByCategoryId(categoryId);
  
  const nPages = Math.ceil(total.amount / limit);
  const pageNumbers = [];
  for (let i = 1; i <= nPages; i++) {
    pageNumbers.push({
      value: i,
      catid: categoryId
    })  
  };

  res.render('vwProduct/new_list', { 
    products: products,
    pageNumbers: pageNumbers,
    currentPage: page,
    totalPages: nPages,
    categoryId: categoryId
  });
});

router.get('/search', async (req, res) => {
  // const q = req.query.q || '';
  // const products = await productModel.findBySearch(q);
  // res.render('vwProduct/bySearch', { products, searchQuery: q });
  const products = await productModel.findAll();
  res.render('vwProduct/new_list', {products: products});  
});

export default router;