import express from 'express';
import * as productModel from '../models/product.model.js';

const router = express.Router();
const N_MINUTES = 20

const prepareProductList = (products) => {
  const now = new Date();
  
  if (!products) return [];

  return products.map(product => {
    const created = new Date(product.created_at);
    const isNew = (now - created) < (N_MINUTES * 60 * 1000);

    return {
      ...product,
      is_new: isNew
    };
  });
};

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

  res.render('vwProduct/list', { 
    products: products,
    pageNumbers: pageNumbers,
    currentPage: page,
    totalPages: nPages,
    categoryId: categoryId
  });
});

router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  if (q.length === 0) {
    return res.render('vwProduct/list', {
        q: q,
        products: []
    });
  }
  const keywords = q.replace(/ /g, ' & ');

  const limit = 6;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;
  const list = await productModel.searchPageByKeywords(keywords, limit, offset);
  const products = prepareProductList(list);
  const total = await productModel.countByKeywords(keywords); 
  const totalCount = total.count;
  const nPages = Math.ceil(totalCount / limit);
  let from = (page - 1) * limit + 1;
  let to = page * limit;
  if (to > totalCount) to = totalCount;
  if (totalCount === 0) { from = 0; to = 0; }
  const page_numbers = [];
  for (let i = 1; i <= nPages; i++) {
    page_numbers.push({
      value: i, 
      isCurrent: i === page
    });
  }
  
  res.render('vwProduct/list', { 
    products: products, 
    page_numbers,
    totalCount,
    from,
    to,
    hasPrev: page > 1,
    prevPage: page - 1,
    hasNext: page < nPages,
    nextPage: page + 1, 
  });  
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