import db from '../utils/db.js';

/**
 * Tạo comment mới cho sản phẩm
 */
export async function createComment(productId, userId, content, parentId = null) {
  return db('product_comments').insert({
    product_id: productId,
    user_id: userId,
    content: content,
    parent_id: parentId,
    created_at: new Date()
  }).returning('*');
}

/**
 * Lấy tất cả comments của sản phẩm (bao gồm replies)
 */
export async function getCommentsByProductId(productId) {
  return db('product_comments')
    .join('users', 'product_comments.user_id', 'users.id')
    .where('product_comments.product_id', productId)
    .whereNull('product_comments.parent_id')
    .select(
      'product_comments.*',
      'users.fullname as user_name',
      'users.role as user_role'
    )
    .orderBy('product_comments.created_at', 'desc');
}

/**
 * Lấy replies của một comment
 */
export async function getRepliesByCommentId(commentId) {
  return db('product_comments')
    .join('users', 'product_comments.user_id', 'users.id')
    .where('product_comments.parent_id', commentId)
    .select(
      'product_comments.*',
      'users.fullname as user_name',
      'users.role as user_role'
    )
    .orderBy('product_comments.created_at', 'asc');
}

/**
 * Xóa comment
 */
export async function deleteComment(commentId, userId) {
  return db('product_comments')
    .where('id', commentId)
    .where('user_id', userId)
    .delete();
}

/**
 * Lấy comment theo ID
 */
export async function findCommentById(commentId) {
  return db('product_comments')
    .where('id', commentId)
    .first();
}
