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

router.get('/detail', async (req, res) => {
  const productId = req.query.id;
  const result = await productModel.findByProductId(productId);
  const product = {
    thumbnail: result[0].thumbnail,
    sub_images: result.reduce((acc, curr) => {
      if (curr.img_link) {
        acc.push(curr.img_link);
      }
      return acc;
    }, []),
    id: result[0].id,
    name: result[0].name,
    starting_price: result[0].starting_price,
    current_price: result[0].current_price,
    buy_now_price: result[0].buy_now_price,
    seller_id: result[0].seller_id,
    hightest_bidder_id: result[0].highest_bidder_id,
    bidder_name: result[0].bidder_name,
    created_at: result[0].created_at,
    end_at: result[0].end_at,
    description: result[0].description
  }
  console.log(product);
  res.render('vwProduct/details', { product });
});

export default router;