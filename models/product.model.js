import db from '../utils/db.js';

export function findAll() {
  return db('products')
    .leftJoin('users as bidder', 'products.highest_bidder_id', 'bidder.id')
    .leftJoin('users as seller', 'products.seller_id', 'seller.id')
    .select(
      'products.*', 'seller.fullname as seller_name', 'bidder.fullname as highest_bidder_name',
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    );
}

export async function findByProductIdForAdmin(productId, userId) {
  // Chuyển sang async để xử lý dữ liệu trước khi trả về controller
  const rows = await db('products')
    // 1. Join lấy thông tin người đấu giá cao nhất (Giữ nguyên)
    .leftJoin('users as bidder', 'products.highest_bidder_id', 'bidder.id')
    .leftJoin('users as seller', 'products.seller_id', 'seller.id')
    // 2. Join lấy danh sách ảnh phụ (Giữ nguyên)
    .leftJoin('product_images', 'products.id', 'product_images.product_id')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    // 3. Join lấy thông tin Watchlist (MỚI THÊM)
    // Logic: Join vào bảng watchlist xem user hiện tại có lưu product này không
    .leftJoin('watchlists', function() {
        this.on('products.id', '=', 'watchlists.product_id')
            .andOnVal('watchlists.user_id', '=', userId || -1); 
            // Nếu userId null (chưa login) thì so sánh với -1 để không khớp
    })

    .where('products.id', productId)
    .select(
      'products.*',
      'product_images.img_link', // Lấy link ảnh phụ để lát nữa gộp mảng
      'bidder.fullname as highest_bidder_name',
      'seller.fullname as seller_name',
      'categories.name as category_name',
      // Logic che tên người đấu giá (Giữ nguyên)
      // Logic đếm số lượt bid (Giữ nguyên)
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `),

      // 4. Logic kiểm tra yêu thích (MỚI THÊM)
      // Nếu cột product_id bên bảng watchlists có dữ liệu -> Đã like (True)
      db.raw('watchlists.product_id IS NOT NULL AS is_favorite')
    );

  // --- PHẦN XỬ LÝ DỮ LIỆU (QUAN TRỌNG) ---
  
  // Nếu không tìm thấy sản phẩm nào
  if (rows.length === 0) return null;

  // SQL trả về nhiều dòng (do 1 sp có nhiều ảnh), ta lấy dòng đầu tiên làm thông tin chính
  const product = rows[0];

  // Gom tất cả img_link của các dòng lại thành mảng sub_images
  // Để phục vụ vòng lặp {{#each product.sub_images}} bên View
  product.sub_images = rows
    .map(row => row.img_link)
    .filter(link => link && link !== product.thumbnail); // Lọc bỏ ảnh null hoặc trùng thumbnail

  return product;
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

export function findByCategoryId(categoryId, limit, offset, sort, currentUserId) {
  // currentUserId: ID của người đang xem (nếu chưa đăng nhập thì truyền null hoặc undefined)

  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    
    // --- ĐOẠN MỚI THÊM VÀO ---
    // Join bảng watchlists với điều kiện product_id khớp VÀ user_id phải là người đang xem
    .leftJoin('watchlists', function() {
      this.on('products.id', '=', 'watchlists.product_id')
        .andOnVal('watchlists.user_id', '=', currentUserId || -1); 
        // Nếu currentUserId là null/undefined (khách vãng lai), dùng -1 để không khớp với ai cả
    })
    // --------------------------

    .where('products.category_id', categoryId)
    .select(
      'products.*',
      
      // Logic che tên người đấu giá (giữ nguyên)
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `),

      // Logic đếm số lượt đấu giá (giữ nguyên)
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `),

      // --- ĐOẠN MỚI THÊM VÀO ---
      // Nếu cột product_id bên bảng watchlists có dữ liệu -> Đã like (True), ngược lại là False
      db.raw('watchlists.product_id IS NOT NULL AS is_favorite')
      // --------------------------
    )
    .modify((queryBuilder) => {
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

export function findByCategoryIds(categoryIds, limit, offset, sort, currentUserId) {
  return db('products')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .leftJoin('watchlists', function() {
      this.on('products.id', '=', 'watchlists.product_id')
        .andOnVal('watchlists.user_id', '=', currentUserId || -1);
    })
    .whereIn('products.category_id', categoryIds)
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
      `),
      db.raw('watchlists.product_id IS NOT NULL AS is_favorite')
    )
    .modify((queryBuilder) => {
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
        queryBuilder.orderBy('products.created_at', 'desc');
      }
    })
    .limit(limit)
    .offset(offset);
}

export function countByCategoryIds(categoryIds) {
  return db('products')
    .whereIn('category_id', categoryIds)
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

export async function findByProductId2(productId, userId) {
  // Chuyển sang async để xử lý dữ liệu trước khi trả về controller
  const rows = await db('products')
    // 1. Join lấy thông tin người đấu giá cao nhất (Giữ nguyên)
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    
    // 2. Join lấy danh sách ảnh phụ (Giữ nguyên)
    .leftJoin('product_images', 'products.id', 'product_images.product_id')

    // 3. Join lấy thông tin Watchlist (MỚI THÊM)
    // Logic: Join vào bảng watchlist xem user hiện tại có lưu product này không
    .leftJoin('watchlists', function() {
        this.on('products.id', '=', 'watchlists.product_id')
            .andOnVal('watchlists.user_id', '=', userId || -1); 
            // Nếu userId null (chưa login) thì so sánh với -1 để không khớp
    })
    .leftJoin('users as seller', 'products.seller_id', 'seller.id')

    .leftJoin('categories', 'products.category_id', 'categories.id')

    .where('products.id', productId)
    .select(
      'products.*',
      'product_images.img_link', // Lấy link ảnh phụ để lát nữa gộp mảng
      'seller.fullname as seller_name',
      'seller.created_at as seller_created_at',
      'categories.name as category_name',

      // Logic che tên người đấu giá (Giữ nguyên)
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `),
      
      // Logic đếm số lượt bid (Giữ nguyên)
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `),

      // 4. Logic kiểm tra yêu thích (MỚI THÊM)
      // Nếu cột product_id bên bảng watchlists có dữ liệu -> Đã like (True)
      db.raw('watchlists.product_id IS NOT NULL AS is_favorite')
    );

  // --- PHẦN XỬ LÝ DỮ LIỆU (QUAN TRỌNG) ---
  
  // Nếu không tìm thấy sản phẩm nào
  if (rows.length === 0) return null;

  // SQL trả về nhiều dòng (do 1 sp có nhiều ảnh), ta lấy dòng đầu tiên làm thông tin chính
  const product = rows[0];

  // Gom tất cả img_link của các dòng lại thành mảng sub_images
  // Để phục vụ vòng lặp {{#each product.sub_images}} bên View
  product.sub_images = rows
    .map(row => row.img_link)
    .filter(link => link && link !== product.thumbnail); // Lọc bỏ ảnh null hoặc trùng thumbnail

  return product;
}

export function addProduct(product) {
  return db('products').insert(product).returning('id');
}

export function addProductImages(images) {
  return db('product_images').insert(images);
}

export function updateProductThumbnail(productId, thumbnailPath) {
  return db('products')
    .where('id', productId)
    .update({ thumbnail: thumbnailPath });
}

export function updateProduct(productId, productData) {
  return db('products')
    .where('id', productId)
    .update(productData);
}

export function deleteProduct(productId) {
  return db('products')
    .where('id', productId)
    .del();
}

// Seller Statistics Functions
export function countProductsBySellerId(sellerId) {
  return db('products')
    .where('seller_id', sellerId)
    .count('id as count')
    .first();
}

export function countActiveProductsBySellerId(sellerId) {
  return db('products')
    .where('seller_id', sellerId)
    .where('end_at', '>', new Date())
    .count('id as count')
    .first();
}

export function countSoldProductsBySellerId(sellerId) {
  return db('products')
    .where('seller_id', sellerId)
    .where('end_at', '<=', new Date())
    .where('is_sold', true)
    .count('id as count')
    .first();
}

export function countPendingProductsBySellerId(sellerId) {
  return db('products')
    .where('seller_id', sellerId)
    .where('end_at', '<=', new Date())
    .whereNotNull('highest_bidder_id')
    .whereNull('is_sold')
    .count('id as count')
    .first();
}

export function countExpiredProductsBySellerId(sellerId) {
  return db('products')
    .where('seller_id', sellerId)
    .where(function() {
      this.where(function() {
        this.where('end_at', '<=', new Date())
            .whereNull('highest_bidder_id');
      })
      .orWhere('is_sold', false);
    })
    .count('id as count')
    .first();
}

export async function getSellerStats(sellerId) {
  const [total, active, sold, pending, expired, pendingRevenue, completedRevenue] = await Promise.all([
    countProductsBySellerId(sellerId),
    countActiveProductsBySellerId(sellerId),
    countSoldProductsBySellerId(sellerId),
    countPendingProductsBySellerId(sellerId),
    countExpiredProductsBySellerId(sellerId),
    // Pending Revenue: Sản phẩm hết hạn, có người thắng nhưng chưa thanh toán
    db('products')
      .where('seller_id', sellerId)
      .where('end_at', '<=', new Date())
      .whereNotNull('highest_bidder_id')
      .whereNull('is_sold')
      .sum('current_price as revenue')
      .first(),
    // Completed Revenue: Sản phẩm đã bán thành công
    db('products')
      .where('seller_id', sellerId)
      .where('is_sold', true)
      .sum('current_price as revenue')
      .first()
  ]);

  const pendingRev = parseFloat(pendingRevenue.revenue) || 0;
  const completedRev = parseFloat(completedRevenue.revenue) || 0;

  return {
    total_products: parseInt(total.count) || 0,
    active_products: parseInt(active.count) || 0,
    sold_products: parseInt(sold.count) || 0,
    pending_products: parseInt(pending.count) || 0,
    expired_products: parseInt(expired.count) || 0,
    pending_revenue: pendingRev,
    completed_revenue: completedRev,
    total_revenue: pendingRev + completedRev
  };
}

export function findAllProductsBySellerId(sellerId) {
  return db('products')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .where('seller_id', sellerId)
    .select(
      'products.*', 'categories.name as category_name',
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `),
      db.raw(`
        CASE
          WHEN is_sold IS TRUE THEN 'Sold'
          WHEN end_at > NOW() THEN 'Active'
          WHEN end_at <= NOW() AND highest_bidder_id IS NOT NULL AND is_sold IS NULL THEN 'Pending'
          When end_at <= NOW() AND highest_bidder_id IS NULL THEN 'No Bidders'
          WHEN is_sold IS FALSE THEN 'Cancelled'
        END AS status
      `)
    );
}

export function findActiveProductsBySellerId(sellerId) {
  return db('products')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .where('seller_id', sellerId)
    .where('end_at', '>', new Date())
    .select(
      'products.*', 'categories.name as category_name', 
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history 
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    );
}

export function findPendingProductsBySellerId(sellerId) {
  return db('products')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .where('seller_id', sellerId)
    .where('end_at', '<=', new Date())
    .whereNotNull('highest_bidder_id')
    .whereNull('is_sold')
    .select(
      'products.*', 
      'categories.name as category_name', 
      'users.fullname as highest_bidder_name',
      'users.email as highest_bidder_email',
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    );
}

export function findSoldProductsBySellerId(sellerId) {
  return db('products')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .leftJoin('users', 'products.highest_bidder_id', 'users.id')
    .where('seller_id', sellerId)
    .where('end_at', '<=', new Date())
    .where('is_sold', true)
    .select(
      'products.*', 
      'categories.name as category_name',
      'users.fullname as highest_bidder_name',
      'users.email as highest_bidder_email',
      db.raw(`
        (
          SELECT COUNT(*) 
          FROM bidding_history
          WHERE bidding_history.product_id = products.id
        ) AS bid_count
      `)
    );
}

export function findExpiredProductsBySellerId(sellerId) {
  return db('products')
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .where('seller_id', sellerId)
    .where(function() {
      this.where(function() {
        this.where('end_at', '<=', new Date())
            .whereNull('highest_bidder_id');
      })
      .orWhere('is_sold', false);
    })
    .select(
      'products.*',
      'categories.name as category_name',
      db.raw(`
        CASE
          WHEN highest_bidder_id IS NULL THEN 'No Bidders'
          ELSE 'Cancelled'
        END AS status
      `)
    );
}

export async function getSoldProductsStats(sellerId) {
  const result = await db('products')
    .where('seller_id', sellerId)
    .where('end_at', '<=', new Date())
    .where('is_sold', true)
    .select(
      db.raw('COUNT(products.id) as total_sold'),
      db.raw('COALESCE(SUM(products.current_price), 0) as total_revenue'),
      db.raw(`
        COALESCE(SUM((
          SELECT COUNT(*)
          FROM bidding_history
          WHERE bidding_history.product_id = products.id
        )), 0) as total_bids
      `)
    )
    .first();

  return {
    total_sold: parseInt(result.total_sold) || 0,
    total_revenue: parseFloat(result.total_revenue) || 0,
    total_bids: parseInt(result.total_bids) || 0
  };
}

export async function getPendingProductsStats(sellerId) {
  const result = await db('products')
    .where('seller_id', sellerId)
    .where('end_at', '<=', new Date())
    .whereNotNull('highest_bidder_id')
    .whereNull('is_sold')
    .select(
      db.raw('COUNT(products.id) as total_pending'),
      db.raw('COALESCE(SUM(products.current_price), 0) as pending_revenue'),
      db.raw(`
        COALESCE(SUM((
          SELECT COUNT(*)
          FROM bidding_history
          WHERE bidding_history.product_id = products.id
        )), 0) as total_bids
      `)
    )
    .first();

  return {
    total_pending: parseInt(result.total_pending) || 0,
    pending_revenue: parseFloat(result.pending_revenue) || 0,
    total_bids: parseInt(result.total_bids) || 0
  };
}

export async function cancelProduct(productId, sellerId) {
  // Get product to verify seller
  const product = await db('products')
    .where('id', productId)
    .first();
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.seller_id !== sellerId) {
    throw new Error('Unauthorized');
  }
  
  // Update product - mark as cancelled
  await updateProduct(productId, {
    is_sold: false,
    closed_at: new Date()
  });
  
  // Return product data for route to use
  return product;
}