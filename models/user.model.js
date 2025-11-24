import db from '../utils/db.js';

export async function add(user) {
  // PostgreSQL
  const rows = await db('users')
    .insert(user)
    .returning(['id', 'email', 'fullname', 'address', 'role', 'email_verified']);
  return rows[0]; // object: { id, email, fullname, ... }
}
export function findByUserName(username) {
  return db('users').where('username', username).first();
}

export function update(id, user) {
  return db('users').where('id', id).update(user);
}

export function findByEmail(email) {
  return db('users').where('email', email).first();
}

// ===================== OTP USING KNEX =====================

// Tạo OTP
export function createOtp({ user_id, otp_code, purpose, expires_at }) {
  return db('user_otps').insert({
    user_id,
    otp_code,
    purpose,
    expires_at
  });
}

// Tìm OTP còn hiệu lực
export function findValidOtp({ user_id, otp_code, purpose }) {
  return db('user_otps')
    .where({
      user_id,
      otp_code,
      purpose,
      used: false
    })
    .andWhere('expires_at', '>', db.fn.now())
    .orderBy('id', 'desc')
    .first();
}

// Đánh dấu OTP đã dùng
export function markOtpUsed(id) {
  return db('user_otps')
    .where('id', id)
    .update({ used: true });
}

// Verify email user
export function verifyUserEmail(user_id) {
  return db('users')
    .where('id', user_id)
    .update({ email_verified: true });
}
