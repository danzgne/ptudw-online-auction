import express from 'express';
import * as productModel from '../models/product.model.js';
import * as reviewModel from '../models/review.model.js';
import * as userModel from '../models/user.model.js';
import * as watchListModel from '../models/watchlist.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as productCommentModel from '../models/productComment.model.js';
import * as categoryModel from '../models/category.model.js';
import * as productDescUpdateModel from '../models/productDescriptionUpdate.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import { sendMail } from '../utils/mailer.js';
import db from '../utils/db.js';
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
  const userId = req.session.authUser ? req.session.authUser.id : null;
  const sort = req.query.sort || '';
  const categoryId = req.query.catid;
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const offset = (page - 1) * limit;
  
  // Check if category is level 1 (parent_id is null)
  const category = await categoryModel.findByCategoryId(categoryId);
  
  let categoryIds = [categoryId];
  
  // If it's a level 1 category, include all child categories
  if (category && category.parent_id === null) {
    const childCategories = await categoryModel.findChildCategoryIds(categoryId);
    const childIds = childCategories.map(cat => cat.id);
    categoryIds = [categoryId, ...childIds];
  }
  
  const products = await productModel.findByCategoryIds(categoryIds, limit, offset, sort, userId);
  const total = await productModel.countByCategoryIds(categoryIds);
  
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
    sort: sort,
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
  const userId = req.session.authUser ? req.session.authUser.id : null;
  const productId = req.query.id;
  const product = await productModel.findByProductId2(productId, userId);
  const related_products = await productModel.findRelatedProducts(productId);
  
  // Kiểm tra nếu không tìm thấy sản phẩm
  if (!product) {
    return res.status(404).render('404', { message: 'Product not found' });
  }

  // Load description updates
  const descriptionUpdates = await productDescUpdateModel.findByProductId(productId);

  // Pagination cho comments
  const commentPage = parseInt(req.query.commentPage) || 1;
  const commentsPerPage = 2; // Mỗi trang 2 comments
  const offset = (commentPage - 1) * commentsPerPage;

  // Load comments với pagination
  const comments = await productCommentModel.getCommentsByProductId(productId, commentsPerPage, offset);
  
  // Load replies cho từng comment
  for (let comment of comments) {
    comment.replies = await productCommentModel.getRepliesByCommentId(comment.id);
  }
  
  // Tính tổng số trang
  const totalComments = await productCommentModel.countCommentsByProductId(productId);
  const totalPages = Math.ceil(totalComments / commentsPerPage);
  
  // Get flash messages from session
  const success_message = req.session.success_message;
  const error_message = req.session.error_message;
  delete req.session.success_message;
  delete req.session.error_message;

  const ratingObject = await reviewModel.calculateRatingPoint(product.seller_id);
  
  console.log(product);
  res.render('vwProduct/details', { 
    product,
    descriptionUpdates,
    comments,
    success_message,
    error_message,
    related_products,
    rating_point: ratingObject.rating_point,
    commentPage,
    totalPages,
    totalComments
  });
});

// ROUTE: BIDDING HISTORY PAGE (Requires Authentication)
router.get('/bidding-history', isAuthenticated, async (req, res) => {
  const productId = req.query.id;
  
  if (!productId) {
    return res.redirect('/');
  }

  try {
    // Get product information
    const product = await productModel.findByProductId2(productId, null);
    
    if (!product) {
      return res.status(404).render('404', { message: 'Product not found' });
    }

    // Load bidding history
    const biddingHistory = await biddingHistoryModel.getBiddingHistory(productId);
    
    res.render('vwProduct/biddingHistory', { 
      product,
      biddingHistory
    });
  } catch (error) {
    console.error('Error loading bidding history:', error);
    res.status(500).render('500', { message: 'Unable to load bidding history' });
  }
});

// ROUTE 1: THÊM VÀO WATCHLIST (POST)
router.post('/watchlist', isAuthenticated, async (req, res) => {
  const userId = req.session.authUser.id;
  const productId = req.body.productId;

  const isInWatchlist = await watchListModel.isInWatchlist(userId, productId);
  if (!isInWatchlist) {
    await watchListModel.addToWatchlist(userId, productId);
  }

  // SỬA LẠI: Lấy địa chỉ trang trước đó từ header
  // Nếu không tìm thấy (trường hợp hiếm), quay về trang chủ '/'
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

// ROUTE 2: XÓA KHỎI WATCHLIST (DELETE)
router.delete('/watchlist', isAuthenticated, async (req, res) => {
  const userId = req.session.authUser.id;
  const productId = req.body.productId;

  await watchListModel.removeFromWatchlist(userId, productId);

  // SỬA LẠI: Tương tự như trên
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

// ROUTE 3: ĐẶT GIÁ (POST) - Server-side rendering
router.post('/bid', isAuthenticated, async (req, res) => {
  const userId = req.session.authUser.id;
  const productId = parseInt(req.body.productId);
  const bidAmount = parseFloat(req.body.bidAmount.replace(/,/g, '')); // Remove commas from input

  try {
    // Get current product information
    const product = await productModel.findByProductId2(productId, null);
    
    if (!product) {
      req.session.error_message = 'Product not found';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Check if seller cannot bid on their own product
    if (product.seller_id === userId) {
      req.session.error_message = 'You cannot bid on your own product';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Check rating point
    const ratingPoint = await userModel.calculateRatingPoint(userId);
    
    // Kiểm tra rating point và quyền bid
    if (ratingPoint.rating_point === 0) {
      // Bidder chưa có rating, kiểm tra cột allow_unrated_bidder của sản phẩm
      if (!product.allow_unrated_bidder) {
        req.session.error_message = 'This seller does not allow bidders without rating to bid on this product.';
        return res.redirect(`/products/detail?id=${productId}`);
      }
      // Nếu allow_unrated_bidder = true, tiếp tục logic bid bình thường
    } else if (ratingPoint.rating_point < 0.8) {
      // Rating dưới 80%, không được phép bid
      req.session.error_message = 'Your rating point is below 80%. You cannot place bids.';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Check if auction has ended
    const now = new Date();
    const endDate = new Date(product.end_at);
    if (now > endDate) {
      req.session.error_message = 'Auction has ended';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Check if seller cannot bid on their own product
    if (product.seller_id === userId) {
      req.session.error_message = 'You cannot bid on your own product';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Check if bid is higher than current price
    const currentPrice = parseFloat(product.current_price || product.starting_price);
    if (bidAmount <= currentPrice) {
      req.session.error_message = `Bid must be higher than current price (${currentPrice.toLocaleString()} VND)`;
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Check minimum bid increment
    const minIncrement = parseFloat(product.step_price);
    if (bidAmount < currentPrice + minIncrement) {
      req.session.error_message = `Bid must be at least ${minIncrement.toLocaleString()} VND higher than current price`;
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Use transaction to ensure data consistency
    await db.transaction(async (trx) => {
      // 1. Add bidding history
      await trx('bidding_history').insert({
        product_id: productId,
        bidder_id: userId,
        price: bidAmount,
        current_price: currentPrice,
        status: 1
      });

      // 2. Update current price and highest bidder for product
      await trx('products')
        .where('id', productId)
        .update({
          current_price: bidAmount,
          highest_bidder_id: userId
        });
    });

    req.session.success_message = `Bid placed successfully! Your bid: ${bidAmount.toLocaleString()} VND`;
    res.redirect(`/products/detail?id=${productId}`);

  } catch (error) {
    console.error('Bid error:', error);
    req.session.error_message = 'An error occurred while placing bid. Please try again.';
    res.redirect(`/products/detail?id=${productId}`);
  }
});

// ROUTE: POST COMMENT
router.post('/comment', isAuthenticated, async (req, res) => {
  const { productId, content, parentId } = req.body;
  const userId = req.session.authUser.id;

  try {
    if (!content || content.trim().length === 0) {
      req.session.error_message = 'Comment cannot be empty';
      return res.redirect(`/products/detail?id=${productId}`);
    }

    // Create comment
    await productCommentModel.createComment(productId, userId, content.trim(), parentId || null);

    // Get product and users for email notification
    const product = await productModel.findByProductId2(productId, null);
    const commenter = await userModel.findById(userId);
    const seller = await userModel.findById(product.seller_id);

    // Send email to seller
    if (seller && seller.email && userId !== product.seller_id) {
      const productUrl = `${req.protocol}://${req.get('host')}/products/detail?id=${productId}`;
      
      if (parentId) {
        // This is a reply - send "New Reply" email
        await sendMail({
          to: seller.email,
          subject: `New reply on your product: ${product.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">New Reply on Your Product</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Product:</strong> ${product.name}</p>
                <p><strong>From:</strong> ${commenter.fullname}</p>
                <p><strong>Reply:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 5px;">${content}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Product & Reply
                </a>
              </div>
            </div>
          `
        });
      } else {
        // This is a new question - send "New Question" email
        await sendMail({
          to: seller.email,
          subject: `New question about your product: ${product.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">New Question About Your Product</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Product:</strong> ${product.name}</p>
                <p><strong>From:</strong> ${commenter.fullname}</p>
                <p><strong>Question:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 5px;">${content}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Product & Answer
                </a>
              </div>
            </div>
          `
        });
      }
    }

    req.session.success_message = 'Comment posted successfully!';
    res.redirect(`/products/detail?id=${productId}`);

  } catch (error) {
    console.error('Post comment error:', error);
    req.session.error_message = 'Failed to post comment. Please try again.';
    res.redirect(`/products/detail?id=${productId}`);
  }
});


// ROUTE 4: GET BIDDING HISTORY
router.get('/bid-history/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const history = await biddingHistoryModel.getBiddingHistory(productId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({ success: false, message: 'Unable to load bidding history' });
  }
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