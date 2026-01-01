import db from '../utils/db.js';

export function addUpdate(productId, content) {
  return db('product_description_updates').insert({
    product_id: productId,
    content: content
    // created_at will use database default CURRENT_TIMESTAMP
  });
}

export function findByProductId(productId) {
  return db('product_description_updates')
    .where('product_id', productId)
    .orderBy('created_at', 'desc');
}

export function deleteByProductId(productId) {
  return db('product_description_updates')
    .where('product_id', productId)
    .del();
}
