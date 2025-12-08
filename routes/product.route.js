import express from 'express';
import * as productModel from '../models/product.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
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
  const sort = req.query.sort || '';
  const categoryId = req.query.catid;
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const offset = (page - 1) * limit;
  const products = await productModel.findByCategoryId(categoryId, limit, offset, sort);
  const total = await productModel.countByCategoryId(categoryId);
  
  const totalCount = total.count;
  const nPages = Math.ceil(totalCount / limit);
  let from = (page - 1) * limit + 1;
  let to = page * limit;
  if (to > totalCount) to = totalCount;
  if (totalCount === 0) { from = 0; to = 0; }
  console.log(`Total pages: ${nPages}`);
  res.render('vwProduct/list', { 
    products: products,
    totalCount,
    from,
    to,
    currentPage: page,
    totalPages: nPages,
    categoryId: categoryId,
    sort: sort
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
  const keywords = q.replace(/ /g, ' | ');

  const limit = 3;
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
  res.render('vwProduct/list', { 
    products: products,
    totalCount,
    from,
    to,
    currentPage: page,
    totalPages: nPages,
    q: q,
  });
});

router.get('/detail', async (req, res) => {
  const productId = req.query.id;
  const result = await productModel.findByProductId(productId);
  const relatedProducts = await productModel.findRelatedProducts(productId);
  // console.log(relatedProducts);
  // console.log(result);
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
    seller_id: result[0].seller_id,
    seller_fullname: result[0].seller_name,
    seller_rating: result[0].seller_rating_plus / (result[0].seller_rating_plus + result[0].seller_rating_minus),
    seller_member_since: new Date(result[0].seller_created_at).getFullYear(),
    buy_now_price: result[0].buy_now_price,
    seller_id: result[0].seller_id,
    hightest_bidder_id: result[0].highest_bidder_id,
    bidder_name: result[0].bidder_name,
    category_name: result[0].category_name,
    bid_count: result[0].bid_count,
    created_at: result[0].created_at,
    end_at: result[0].end_at,
    description: result[0].description,
    related_products: relatedProducts
  }
  // console.log(product);
  res.render('vwProduct/details', { product });
});

export default router;