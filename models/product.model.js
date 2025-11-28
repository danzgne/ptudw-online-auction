import db from '../utils/db.js';

export function findAll() {
  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .select(
      'products.*', 
    
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `),
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    );
}

export function findByCategoryId(categoryId, limit, offset) {
  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .where('products.category_id', categoryId) 
    .limit(limit)
    .offset(offset)
    .select(
      'products.*',
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `),
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    );
}

export function countByCategoryId(categoryId) {
  return db('products')
    .where('category_id', categoryId)
    .count('id as amount')
    .first();
}

// Helper chung để select cột và che tên bidder
const BASE_QUERY = db('products')
  .leftJoin('users', 'products.highest_bidder_id', 'users.id')
  .select(
    'products.*',
    db.raw(`
      CASE 
        WHEN users.fullname IS NOT NULL THEN 
          OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
        ELSE NULL 
      END AS bidder_name
    `),
    db.raw(`(SELECT COUNT(*) FROM bidding_history WHERE product_id = products.id) AS bid_count`)
  )
  .where('end_at', '>', new Date()) // Chỉ lấy sản phẩm chưa hết hạn
  .limit(5); // Top 5

export function findTopEnding() {
  // Sắp hết hạn: Sắp xếp thời gian kết thúc TĂNG DẦN (gần nhất lên đầu)
  return BASE_QUERY.clone().orderBy('end_at', 'asc');
}

export function findTopPrice() {
  // Giá cao nhất: Sắp xếp giá hiện tại GIẢM DẦN
  return BASE_QUERY.clone().orderBy('current_price', 'desc');
}

export function findTopBids() {
  // Nhiều lượt ra giá nhất: Sắp xếp theo số lượt bid GIẢM DẦN
  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .select(
      'products.*',
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `),
      db.raw(`(SELECT COUNT(*) FROM bidding_history WHERE product_id = products.id) AS bid_count`)
    )
    .where('end_at', '>', new Date())
    .orderBy('bid_count', 'desc') // Order by cột alias bid_count
    .limit(5);
}

export function findByProductId(productId) {
  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .where('products.id', productId)
    .select(
      'products.*',
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `),
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    )
    .first();
}