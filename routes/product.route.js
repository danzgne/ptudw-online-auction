import express from 'express';
import * as productModel from '../models/product.model.js';

const router = express.Router();

router.get('/category/:id', async (req, res) => {
  const categoryId = req.params.id;
  const products = await productModel.findByCategoryId(categoryId);
  res.render('vwProduct/list', { products });
});

export default router;