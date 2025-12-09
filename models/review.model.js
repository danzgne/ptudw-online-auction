import db from '../utils/db.js';

export function calculateRatingPoint(user_id) {
    return db('reviews')
        .where('reviewee_id', user_id)
        .select(
            db.raw(`
                CASE 
                    WHEN (COUNT(CASE WHEN rating = -1 THEN 1 END) + COUNT(CASE WHEN rating = 1 THEN 1 END)) = 0 
                    THEN 0
                    ELSE 
                        COUNT(CASE WHEN rating = 1 THEN 1 END)::float / 
                        (COUNT(CASE WHEN rating = -1 THEN 1 END) + COUNT(CASE WHEN rating = 1 THEN 1 END))
                END as rating_point
            `)
        )
        .first();
}

/**
 * Lấy tất cả reviews của user (được đánh giá)
 * @param {number} user_id - ID của user
 * @returns {Promise<Array>} Danh sách reviews
 */
export function getReviewsByUserId(user_id) {
    return db('reviews')
        .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
        .join('products', 'reviews.product_id', 'products.id')
        .where('reviews.reviewee_id', user_id)
        .select(
            'reviews.*',
            'reviewer.fullname as reviewer_name',
            'products.name as product_name'
        )
        .orderBy('reviews.created_at', 'desc');
}

/**
 * Tạo review mới
 * @param {Object} reviewData - Dữ liệu review
 * @returns {Promise} Kết quả insert
 */
export function createReview(reviewData) {
    return db('reviews').insert(reviewData).returning('*');
}
