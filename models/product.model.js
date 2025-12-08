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
export function findPage(limit, offset) {
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
    ).limit(limit).offset(offset);
}

// 1. Hàm tìm kiếm phân trang (Full FTS - Hỗ trợ Parent Category)
export function searchPageByKeywords(keywords, limit, offset) {
  return db('products')
    // JOIN 1: Lấy thông tin danh mục trực tiếp (Danh mục con - Child)
    .join('categories as c', 'products.category_id', 'c.id')
    
    // JOIN 2: Self-Join để lấy thông tin danh mục cha (Parent)
    // Dùng LEFT JOIN vì có thể danh mục đó không có cha (parent_id là NULL)
    .leftJoin('categories as p', 'c.parent_id', 'p.id')
    
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .where((builder) => {
        builder
          // 1. Tìm trong tên sản phẩm (Product Name)
          .whereRaw(`products.fts @@ to_tsquery('simple', remove_accents(?))`, [keywords])
          
          // 2. Tìm trong tên danh mục con HOẶC tên danh mục cha
          // Logic: Nối chuỗi tên con và tên cha lại rồi tạo vector để tìm
          // COALESCE(p.name, '') để xử lý trường hợp không có cha (null) thì thay bằng rỗng
          .orWhereRaw(`
            to_tsvector('simple', remove_accents(c.name) || ' ' || remove_accents(COALESCE(p.name, ''))) 
            @@ to_tsquery('simple', remove_accents(?))
          `, [keywords]);
    })
    .select(
      'products.*',
      // 'c.name as category_name', // Tên danh mục con
      // 'p.name as parent_category_name', // Tên danh mục cha
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
    .limit(limit)
    .offset(offset);
}

// 2. Hàm đếm tổng số lượng (Full FTS - Hỗ trợ Parent Category)
export function countByKeywords(keywords) {
  return db('products')
    .join('categories as c', 'products.category_id', 'c.id')
    .leftJoin('categories as p', 'c.parent_id', 'p.id') // Cũng phải Join bảng cha ở đây
    .where((builder) => {
        builder
          .whereRaw(`products.fts @@ to_tsquery('simple', remove_accents(?))`, [keywords])
          .orWhereRaw(`
            to_tsvector('simple', remove_accents(c.name) || ' ' || remove_accents(COALESCE(p.name, ''))) 
            @@ to_tsquery('simple', remove_accents(?))
          `, [keywords]);
    })
    .count('products.id as count')
    .first();
}
export function countAll() {
  return db('products').count('id as count').first();
}
export function findByCategoryId(categoryId, limit, offset, sort) {
  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .where('products.category_id', categoryId)
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
    .modify((queryBuilder) => {
      // Sửa lại logic sort để khớp với Frontend
      if (sort === 'price_asc') {
        queryBuilder.orderBy('products.current_price', 'asc');
      }
      else if (sort === 'price_desc') {
        queryBuilder.orderBy('products.current_price', 'desc');
      }
      else if (sort === 'newest') {
        queryBuilder.orderBy('products.created_at', 'desc');
      }
      else if (sort === 'oldest') {
        queryBuilder.orderBy('products.created_at', 'asc');
      }
      else {
        // Mặc định là Newest First
        queryBuilder.orderBy('products.created_at', 'desc');
      }
    })
    .limit(limit)
    .offset(offset);
}

export function countByCategoryId(categoryId) {
  return db('products')
    .where('category_id', categoryId)
    .count('id as count')
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
    .leftJoin('users as highest_bidder', 'products.highest_bidder_id', 'highest_bidder.id')
    .leftJoin('product_images', 'products.id', 'product_images.product_id')
    .leftJoin('users as seller', 'products.seller_id', 'seller.id')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .where('products.id', productId)
    .select(
      'products.*',
      'product_images.img_link',
      'seller.fullname as seller_name',
      'seller.rating_plus as seller_rating_plus',
      'seller.rating_minus as seller_rating_minus',
      'seller.created_at as seller_created_at',
      'categories.name as category_name',
      db.raw(`
        CASE 
          WHEN highest_bidder.fullname IS NOT NULL THEN 
            OVERLAY(highest_bidder.fullname PLACING '****' FROM 1 FOR (LENGTH(highest_bidder.fullname)/2)::INTEGER)
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
}

export function findRelatedProducts(productId) {
    return db('products')
      .leftJoin('products as p2', 'products.category_id', 'p2.category_id')
      .where('products.id', productId)
      .andWhere('p2.id', '!=', productId)
      .select('p2.*')
      .limit(5);
  } 