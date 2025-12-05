import db from '../utils/db.js';

export function searchPageByUserId(user_id, limit, offset) {
    return db('watchlists')
        .join('products', 'watchlists.product_id', 'products.id')
        .where('watchlists.user_id', user_id)
        .limit(limit)
        .offset(offset)
        .select('products.*');
}

export function countByUserId(user_id) {
    return db('watchlists')
        .where('user_id', user_id)
        .count('product_id as count')
        .first();
}