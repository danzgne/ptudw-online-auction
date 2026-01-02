import db from '../utils/db.js';

/**
 * Thêm một lượt bid mới vào hệ thống
 * @param {number} productId - ID sản phẩm
 * @param {number} bidderId - ID người đặt giá
 * @param {number} currentPrice - Giá hiện tại của sản phẩm sau khi update
 * @returns {Promise} Kết quả insert
 */
export async function createBid(productId, bidderId, currentPrice) {
  return db('bidding_history').insert({
    product_id: productId,
    bidder_id: bidderId,
    current_price: currentPrice
  }).returning('*');
}

/**
 * Lấy lịch sử đấu giá của một sản phẩm
 * @param {number} productId - ID sản phẩm
 * @returns {Promise<Array>} Danh sách lịch sử bid
 */
export async function getBiddingHistory(productId) {
  return db('bidding_history')
    .join('users', 'bidding_history.bidder_id', 'users.id')
    .where('bidding_history.product_id', productId)
    .select(
      'bidding_history.*',
      db.raw(`
        CASE 
          WHEN users.fullname IS NOT NULL THEN 
            OVERLAY(users.fullname PLACING '****' FROM 1 FOR (LENGTH(users.fullname)/2)::INTEGER)
          ELSE NULL 
        END AS bidder_name
      `)
    )
    .orderBy('bidding_history.created_at', 'desc');
}

/**
 * Lấy bid cao nhất của một sản phẩm
 * @param {number} productId - ID sản phẩm
 * @returns {Promise<Object>} Bid cao nhất
 */
export async function getHighestBid(productId) {
  return db('bidding_history')
    .where('product_id', productId)
    .orderBy('current_price', 'desc')
    .first();
}

/**
 * Kiểm tra xem user đã bid cho sản phẩm này chưa
 * @param {number} productId - ID sản phẩm
 * @param {number} bidderId - ID người đặt giá
 * @returns {Promise<boolean>} True nếu đã bid
 */
export async function hasUserBidOnProduct(productId, bidderId) {
  const result = await db('bidding_history')
    .where('product_id', productId)
    .where('bidder_id', bidderId)
    .first();
  return !!result;
}