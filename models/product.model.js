import db from '../utils/db.js';

export function findByCategoryId(categoryId) {
  return db('products').where('category_id', categoryId);
}
export function findAll(){
  return db('products');
}