BEGIN;

-- ==========================================
-- 1. CLEAN UP & RESET IDs
-- ==========================================
-- Xóa sạch dữ liệu cũ và reset bộ đếm ID về 1
TRUNCATE TABLE reviews, order_chats, orders, product_description_updates, auto_bidding, bidding_history, watchlists, product_images, products, categories, upgrade_requests, user_otps, users, system_settings RESTART IDENTITY CASCADE;

-- Set timezone session để đảm bảo dữ liệu nhập vào chuẩn giờ VN
SET TIME ZONE 'Asia/Ho_Chi_Minh';

-- ==========================================
-- 2. CREATE CATEGORIES
-- ==========================================
INSERT INTO categories (name, parent_id) VALUES
('Electronics', NULL),       -- ID 1
('Mobile Phones', 1),        -- ID 2
('Laptops', 1),              -- ID 3
('Fashion', NULL),           -- ID 4
('Shoes', 4),                -- ID 5
('Watches', 4),              -- ID 6
('Home Appliances', NULL),   -- ID 7
('Kitchen Tools', 7);        -- ID 8

-- ==========================================
-- 3. CREATE USERS
-- ==========================================
INSERT INTO users (fullname, address, email, password_hash, role, email_verified) VALUES
('John Smith', '123 5th Avenue, New York, USA', 'john.seller@store.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'admin', TRUE),  -- ID 1
('Sarah Jenkins', '45 Oxford Street, London, UK', 'sarah.boutique@uk.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'seller', TRUE), -- ID 2
('Michael Brown', '88 George Street, Sydney, Australia', 'mike.trader@au.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'seller', TRUE), -- ID 3
('David Miller', 'Beverly Hills, California, USA', 'david.vip@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 4 (Good Bidder)
('Emily Wilson', 'Toronto, Canada', 'emily.w@yahoo.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 5
('Robert Taylor', 'Berlin, Germany', 'robert.bad@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 6 (Bad Bidder)
('Jessica Davis', 'Paris, France', 'jessica.new@outlook.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 7
('Daniel Anderson', 'Silicon Valley, USA', 'dan.tech@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 8
('Lisa Thomas', 'Singapore', 'lisa.collector@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 9
('James White', 'Dubai, UAE', 'james.rich@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE), -- ID 10
('Nguyễn Hoàng Đăng', 'TPHCM VN', 'hoangdang.sn0704@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'seller', TRUE), -- ID 11
('Ngô Quang Đạt', 'TPHCM VN', 'quangdat@gmail.com', '$2b$10$oWF4jeeZwmCx7VeoB97az.8pH4l1oC0OG1AcbVc8vllc20AhLKaWW', 'bidder', TRUE); -- ID 12

-- ==========================================
-- 4. CREATE PRODUCTS (25 Active + others)
-- ==========================================
INSERT INTO products 
(name, category_id, seller_id, starting_price, step_price, buy_now_price, current_price, highest_bidder_id, thumbnail, created_at, end_at, auto_extend, description, is_sold, allow_unrated_bidder, closed_at) 
VALUES

-- ============================================
-- === ACTIVE PRODUCTS (ID 1-25) ===
-- end_at: 5/2026 - 11/2026 (4-10 months from now)
-- is_sold = NULL | closed_at = NULL
-- ============================================

-- ID 1: iPhone 15 Pro Max
('iPhone 15 Pro Max 256GB', 2, 1, 25000000, 500000, 40000000, 28000000, 4, 'images/products/p1_thumb.jpg',
 '2025-12-05 00:00:00', '2026-05-15', TRUE, '<p>iPhone 15 Pro Max 256GB Natural Titanium. Like new condition, battery 96%. Full box with all accessories. AppleCare+ until 2026.</p>', NULL, FALSE, NULL),

-- ID 2: Samsung Galaxy S24 Ultra
('Samsung Galaxy S24 Ultra', 2, 2, 22000000, 300000, 35000000, 25000000, NULL, 'images/products/p2_thumb.jpg',
 '2025-12-06', '2026-06-01', TRUE, '<p>Samsung Galaxy S24 Ultra 512GB Titanium Black. S-Pen included. Official warranty 11 months remaining.</p>', NULL, TRUE, NULL),

-- ID 3: iPhone 14 128GB
('iPhone 14 128GB', 2, 3, 12000000, 200000, 20000000, 14500000, 9, 'images/products/p3_thumb.jpg',
 '2025-12-07', '2026-07-20', FALSE, '<p>iPhone 14 128GB Blue. Excellent condition, battery 92%. Full box with charger and cable.</p>', NULL, TRUE, NULL),

-- ID 4: Samsung Galaxy A54 5G
('Samsung Galaxy A54 5G', 2, 1, 6000000, 100000, 10000000, 7200000, NULL, 'images/products/p4_thumb.jpg',
 '2025-12-05', '2026-05-10', TRUE, '<p>Samsung Galaxy A54 5G 256GB. Water resistant IP67. Awesome camera for the price.</p>', NULL, FALSE, NULL),

-- ID 5: iPhone 13 Mini
('iPhone 13 Mini 128GB', 2, 2, 8000000, 200000, 14000000, 9500000, 5, 'images/products/p5_thumb.jpg',
 '2025-12-04', '2026-08-15', TRUE, '<p>iPhone 13 Mini 128GB Pink. Compact flagship phone. Perfect for one-hand use. Battery 89%.</p>', NULL, TRUE, NULL),

-- ID 6: MacBook Air M2
('MacBook Air M2 2022', 3, 3, 22000000, 400000, 35000000, 26000000, 10, 'images/products/p6_thumb.jpg',
 '2025-12-01', '2026-09-30', TRUE, '<p>MacBook Air M2 8GB RAM, 256GB SSD, Midnight color. Cycle count: 45. AppleCare+ included.</p>', NULL, FALSE, NULL),

-- ID 7: Dell Inspiron 15
('Dell Inspiron 15 3520', 3, 1, 10000000, 200000, 18000000, 12000000, NULL, 'images/products/p7_thumb.jpg',
 '2025-12-08', '2026-10-28', FALSE, '<p>Dell Inspiron 15 - Intel Core i5-1235U, 8GB RAM, 512GB SSD. Great for students and office work.</p>', NULL, FALSE, NULL),

-- ID 8: HP Pavilion Gaming
('HP Pavilion Gaming 15', 3, 2, 15000000, 300000, 25000000, 18500000, 7, 'images/products/p8_thumb.jpg',
 '2025-12-02', '2026-06-25', TRUE, '<p>HP Pavilion Gaming 15 - Intel i7, RTX 3050, 16GB RAM. Perfect entry-level gaming laptop.</p>', NULL, TRUE, NULL),

-- ID 9: Asus VivoBook 15
('Asus VivoBook 15 OLED', 3, 3, 12000000, 200000, 20000000, 14800000, 8, 'images/products/p9_thumb.jpg',
 '2025-12-03', '2026-07-10', TRUE, '<p>Asus VivoBook 15 OLED - Ryzen 5 5600H, 16GB RAM. Stunning OLED display for content creators.</p>', NULL, TRUE, NULL),

-- ID 10: Lenovo ThinkPad E14
('Lenovo ThinkPad E14 Gen 5', 3, 1, 14000000, 200000, 24000000, 16500000, NULL, 'images/products/p10_thumb.jpg',
 '2025-12-01', '2026-11-01', TRUE, '<p>Lenovo ThinkPad E14 - Intel i5 Gen 13, 16GB RAM. Legendary keyboard, built for business professionals.</p>', NULL, FALSE, NULL),

-- ID 11: AirPods Pro 2
('Apple AirPods Pro 2nd Gen', 1, 1, 4000000, 100000, 7000000, 5200000, 12, 'images/products/p11_thumb.jpg',
 '2025-12-10', '2026-05-20', TRUE, '<p>Apple AirPods Pro 2nd Generation with USB-C. Active Noise Cancellation. Full box sealed.</p>', NULL, FALSE, NULL),

-- ID 12: Sony WH-1000XM5
('Sony WH-1000XM5 Headphones', 1, 1, 5000000, 100000, 9000000, 6500000, 5, 'images/products/p12_thumb.jpg',
 '2025-12-11', '2026-06-15', TRUE, '<p>Sony WH-1000XM5 Wireless Headphones Black. Industry-leading noise cancellation. 30-hour battery.</p>', NULL, FALSE, NULL),

-- ID 13: iPad Air 5
('Apple iPad Air 5 M1', 1, 2, 12000000, 200000, 20000000, 14500000, 4, 'images/products/p13_thumb.jpg',
 '2025-12-12', '2026-08-30', TRUE, '<p>iPad Air 5 M1 chip 64GB WiFi Space Gray. Works with Apple Pencil 2nd gen. Perfect for artists.</p>', NULL, FALSE, NULL),

-- ID 14: Nike Air Force 1
('Nike Air Force 1 Low White', 5, 2, 2000000, 50000, 4000000, 2600000, 7, 'images/products/p14_thumb.jpg',
 '2025-12-13', '2026-09-20', TRUE, '<p>Nike Air Force 1 07 Low White. Size 42. Deadstock, brand new with box. Classic sneaker.</p>', NULL, TRUE, NULL),

-- ID 15: Apple Watch Series 9
('Apple Watch Series 9 GPS', 6, 3, 8000000, 200000, 14000000, 9800000, 4, 'images/products/p15_thumb.jpg',
 '2025-12-14', '2026-06-30', TRUE, '<p>Apple Watch Series 9 GPS 45mm Midnight Aluminum. Blood oxygen, ECG features. Full box.</p>', NULL, FALSE, NULL),

-- ID 16: Samsung Galaxy Tab S9
('Samsung Galaxy Tab S9', 1, 3, 15000000, 300000, 25000000, 18000000, 10, 'images/products/p16_thumb.jpg',
 '2025-12-15', '2026-07-15', TRUE, '<p>Samsung Galaxy Tab S9 128GB WiFi. S-Pen included. AMOLED display 120Hz. Great for productivity.</p>', NULL, FALSE, NULL),

-- ID 17: Canon EOS R50
('Canon EOS R50 Mirrorless', 1, 2, 18000000, 300000, 28000000, 21000000, 8, 'images/products/p17_thumb.jpg',
 '2025-12-16', '2026-08-20', TRUE, '<p>Canon EOS R50 with RF-S 18-45mm lens. 24.2MP APS-C sensor. Perfect for beginners and vloggers.</p>', NULL, TRUE, NULL),

-- ID 18: Adidas Ultraboost 23
('Adidas Ultraboost Light', 5, 2, 3000000, 50000, 5500000, 3800000, 9, 'images/products/p18_thumb.jpg',
 '2025-12-17', '2026-09-10', TRUE, '<p>Adidas Ultraboost Light running shoes. Size 43. Brand new, never worn. Best comfort for running.</p>', NULL, FALSE, NULL),

-- ID 19: Casio G-Shock GA-2100
('Casio G-Shock GA-2100', 6, 1, 2500000, 50000, 4500000, 3200000, 7, 'images/products/p19_thumb.jpg',
 '2025-12-18', '2026-10-05', TRUE, '<p>Casio G-Shock GA-2100-1A1 CasiOak. Carbon Core Guard. Water resistant 200m. Full box.</p>', NULL, TRUE, NULL),

-- ID 20: Sony PlayStation 5
('Sony PlayStation 5 Slim', 1, 3, 12000000, 300000, 18000000, 14500000, 10, 'images/products/p20_thumb.jpg',
 '2025-12-19', '2026-11-15', TRUE, '<p>PlayStation 5 Slim Digital Edition 1TB. 2 DualSense controllers included. Perfect condition.</p>', NULL, FALSE, NULL),

-- ID 21: JBL Flip 6
('JBL Flip 6 Bluetooth Speaker', 1, 1, 2000000, 50000, 4000000, 2700000, 8, 'images/products/p21_thumb.jpg',
 '2025-12-20', '2026-06-20', TRUE, '<p>JBL Flip 6 Portable Speaker Blue. IP67 waterproof. 12-hour playtime. PartyBoost compatible.</p>', NULL, TRUE, NULL),

-- ID 22: Philips Air Fryer XXL
('Philips Air Fryer XXL', 8, 2, 4000000, 100000, 7000000, 5200000, 5, 'images/products/p22_thumb.jpg',
 '2025-12-21', '2026-07-25', TRUE, '<p>Philips Airfryer XXL HD9650. Rapid Air Technology. Fat Removal tech. Family size capacity.</p>', NULL, TRUE, NULL),

-- ID 23: LG Smart TV 55 inch
('LG 55 inch 4K Smart TV', 7, 3, 10000000, 200000, 18000000, 12500000, NULL, 'images/products/p23_thumb.jpg',
 '2025-12-22', '2026-08-10', TRUE, '<p>LG 55UP7750 55 inch 4K UHD Smart TV. WebOS, ThinQ AI. Gaming Mode. Magic Remote included.</p>', NULL, FALSE, NULL),

-- ID 24: Seiko Presage
('Seiko Presage Automatic', 6, 1, 8000000, 200000, 14000000, 10000000, 10, 'images/products/p24_thumb.jpg',
 '2025-12-23', '2026-09-25', TRUE, '<p>Seiko Presage SRPD37J1 Cocktail Time. Automatic movement. Japanese craftsmanship. Full box papers.</p>', NULL, FALSE, NULL),

-- ID 25: Xiaomi Robot Vacuum
('Xiaomi Robot Vacuum S10', 7, 2, 6000000, 100000, 10000000, 7500000, 8, 'images/products/p25_thumb.jpg',
 '2025-12-24', '2026-10-30', TRUE, '<p>Xiaomi Robot Vacuum S10. LDS laser navigation. Mopping function. App control with smart mapping.</p>', NULL, TRUE, NULL),


-- ============================================
-- === SOLD PRODUCTS (ID 26-28) ===
-- is_sold = TRUE | closed_at = sale date
-- ============================================

-- ID 26: AirPods 3
('Apple AirPods 3rd Gen', 1, 3, 3000000, 100000, 5000000, 3800000, 4, 'images/products/p26_thumb.jpg',
 '2025-11-01', '2025-11-25', TRUE, '<p>Apple AirPods 3rd Generation. Spatial Audio. MagSafe charging case. Full box sealed.</p>', TRUE, FALSE, '2025-11-25 12:00:00'),

-- ID 27: Logitech MX Master 3S
('Logitech MX Master 3S Mouse', 1, 1, 1500000, 50000, 3000000, 2100000, 5, 'images/products/p27_thumb.jpg',
 '2025-11-15', '2025-11-30', TRUE, '<p>Logitech MX Master 3S Wireless Mouse. Quiet clicks. 8K DPI sensor. USB-C fast charging.</p>', TRUE, FALSE, '2025-11-30 14:00:00'),

-- ID 28: Samsung Monitor 27 inch
('Samsung 27 inch Monitor', 1, 3, 4000000, 100000, 7000000, 5200000, 10, 'images/products/p28_thumb.jpg',
 '2025-11-20', '2025-12-10', TRUE, '<p>Samsung Odyssey G5 27 inch QHD 165Hz. Curved gaming monitor. 1ms response time.</p>', TRUE, FALSE, '2025-12-10 10:30:00'),


-- ============================================
-- === CANCELLED PRODUCTS (ID 29-30) ===
-- is_sold = FALSE | closed_at = cancel date
-- ============================================

-- ID 29: Razer DeathAdder V3
('Razer DeathAdder V3 Mouse', 1, 1, 1200000, 50000, 2500000, 1700000, 6, 'images/products/p29_thumb.jpg',
 '2025-11-12', '2025-11-22', TRUE, '<p>Razer DeathAdder V3 Ergonomic Gaming Mouse. Winner did not complete payment.</p>', FALSE, FALSE, '2025-11-22 09:15:00'),

-- ID 30: Converse Chuck Taylor
('Converse Chuck Taylor All Star', 5, 2, 1000000, 50000, 2000000, 1400000, 6, 'images/products/p30_thumb.jpg',
 '2025-11-08', '2025-11-18', TRUE, '<p>Converse Chuck Taylor All Star High Top Black. Size 42. Winner abandoned auction.</p>', FALSE, FALSE, '2025-11-18 14:45:00'),


-- ============================================
-- === EXPIRED PRODUCTS - NO BID (ID 31-32) ===
-- is_sold = NULL | closed_at = NULL | end_at < now() | highest_bidder_id IS NULL
-- ============================================

-- ID 31: Old iPod Classic
('Apple iPod Classic 160GB', 1, 1, 2000000, 100000, 5000000, 2000000, NULL, 'images/products/p31_thumb.jpg',
 '2025-11-01', '2025-11-15', FALSE, '<p>Apple iPod Classic 160GB. Vintage collector item. Working condition. No bids received.</p>', NULL, TRUE, NULL),

-- ID 32: Used Coffee Maker
('Delonghi Coffee Maker', 8, 2, 500000, 50000, 1500000, 500000, NULL, 'images/products/p32_thumb.jpg',
 '2025-11-10', '2025-11-25', FALSE, '<p>Delonghi Drip Coffee Maker. Used for 2 years. Still works perfectly. Expired with no bids.</p>', NULL, TRUE, NULL),


-- ============================================
-- === PENDING PRODUCTS (ID 33-34) ===
-- end_at < now | highest_bidder != NULL | is_sold NULL | closed_at NULL
-- ============================================

-- ID 33: GoPro Hero 12
('GoPro Hero 12 Black', 1, 1, 8000000, 200000, 14000000, 10500000, 4, 'images/products/p33_thumb.jpg',
 '2025-11-01', '2025-11-20', FALSE, '<p>GoPro Hero 12 Black. 5.3K video. Waterproof. Awaiting winner payment confirmation.</p>', NULL, TRUE, NULL),

-- ID 34: Nintendo Switch OLED
('Nintendo Switch OLED', 1, 2, 6000000, 100000, 10000000, 7800000, 7, 'images/products/p34_thumb.jpg',
 '2025-11-10', '2025-11-28', FALSE, '<p>Nintendo Switch OLED White. Includes Mario Kart 8. Awaiting payment from winner.</p>', NULL, TRUE, NULL);


-- ==========================================
-- 5. CREATE ORDERS (For Sold Products 26-28)
-- ==========================================
INSERT INTO orders (product_id, seller_id, winner_id, status, created_at) VALUES 
(26, 3, 4, 'completed', '2025-11-26'),
(27, 1, 5, 'completed', '2025-12-01'),
(28, 3, 10, 'completed', '2025-12-11');

-- ==========================================
-- 6. REVIEWS (For completed transactions)
-- ==========================================
INSERT INTO reviews (product_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
-- David (4) reviews for product 26
(26, 4, 3, 1, 'Đồng hồ đẹp, giao hàng nhanh.', '2025-11-27'),
(26, 3, 4, 1, 'Người mua uy tín, thanh toán nhanh.', '2025-11-27'),

-- Emily (5) reviews for product 27
(27, 5, 1, 1, 'Tai nghe chống ồn cực tốt.', '2025-12-02'),
(27, 1, 5, 1, 'Giao dịch thuận lợi.', '2025-12-02'),

-- James (10) reviews for product 28
(28, 10, 3, 1, 'Màn hình gaming đỉnh cao.', '2025-12-12'),
(28, 3, 10, 1, 'Thanh toán đúng hẹn.', '2025-12-12'),

-- Robert (6) - Bad reviews for cancelled products
(29, 1, 6, -1, 'Người thắng không thanh toán, hủy giao dịch.', '2025-11-23'),
(30, 2, 6, -1, 'Bỏ cuộc sau khi thắng đấu giá.', '2025-11-19');

-- ==========================================
-- 7. PRODUCT IMAGES (ALL PRODUCTS 1-34)
-- ==========================================
INSERT INTO product_images (product_id, img_link) VALUES
-- Active Products (ID 1-25)
(1, 'images/products/p1_1.jpg'), (1, 'images/products/p1_2.jpg'), (1, 'images/products/p1_3.jpg'),
(2, 'images/products/p2_1.jpg'), (2, 'images/products/p2_2.jpg'), (2, 'images/products/p2_3.jpg'),
(3, 'images/products/p3_1.jpg'), (3, 'images/products/p3_2.jpg'), (3, 'images/products/p3_3.jpg'),
(4, 'images/products/p4_1.jpg'), (4, 'images/products/p4_2.jpg'), (4, 'images/products/p4_3.jpg'),
(5, 'images/products/p5_1.jpg'), (5, 'images/products/p5_2.jpg'), (5, 'images/products/p5_3.jpg'),
(6, 'images/products/p6_1.jpg'), (6, 'images/products/p6_2.jpg'), (6, 'images/products/p6_3.jpg'),
(7, 'images/products/p7_1.jpg'), (7, 'images/products/p7_2.jpg'), (7, 'images/products/p7_3.jpg'),
(8, 'images/products/p8_1.jpg'), (8, 'images/products/p8_2.jpg'), (8, 'images/products/p8_3.jpg'),
(9, 'images/products/p9_1.jpg'), (9, 'images/products/p9_2.jpg'), (9, 'images/products/p9_3.jpg'),
(10, 'images/products/p10_1.jpg'), (10, 'images/products/p10_2.jpg'), (10, 'images/products/p10_3.jpg'),
(11, 'images/products/p11_1.jpg'), (11, 'images/products/p11_2.jpg'),
(12, 'images/products/p12_1.jpg'), (12, 'images/products/p12_2.jpg'),
(13, 'images/products/p13_1.jpg'), (13, 'images/products/p13_2.jpg'),
(14, 'images/products/p14_1.jpg'), (14, 'images/products/p14_2.jpg'),
(15, 'images/products/p15_1.jpg'), (15, 'images/products/p15_2.jpg'),
(16, 'images/products/p16_1.jpg'), (16, 'images/products/p16_2.jpg'),
(17, 'images/products/p17_1.jpg'), (17, 'images/products/p17_2.jpg'),
(18, 'images/products/p18_1.jpg'), (18, 'images/products/p18_2.jpg'),
(19, 'images/products/p19_1.jpg'), (19, 'images/products/p19_2.jpg'),
(20, 'images/products/p20_1.jpg'), (20, 'images/products/p20_2.jpg'),
(21, 'images/products/p21_1.jpg'), (21, 'images/products/p21_2.jpg'),
(22, 'images/products/p22_1.jpg'), (22, 'images/products/p22_2.jpg'),
(23, 'images/products/p23_1.jpg'), (23, 'images/products/p23_2.jpg'),
(24, 'images/products/p24_1.jpg'), (24, 'images/products/p24_2.jpg'),
(25, 'images/products/p25_1.jpg'), (25, 'images/products/p25_2.jpg'),

-- Sold Products (ID 26-28)
(26, 'images/products/p26_1.jpg'),
(27, 'images/products/p27_1.jpg'),
(28, 'images/products/p28_1.jpg'),

-- Cancelled Products (ID 29-30)
(29, 'images/products/p29_1.jpg'),
(30, 'images/products/p30_1.jpg'),

-- Expired Products (ID 31-32)
(31, 'images/products/p31_1.jpg'),
(32, 'images/products/p32_1.jpg'),

-- Pending Products (ID 33-34)
(33, 'images/products/p33_1.jpg'),
(34, 'images/products/p34_1.jpg');


-- ==========================================
-- 8. BIDDING HISTORY (For active products with bids)
-- ==========================================
INSERT INTO bidding_history (product_id, bidder_id, current_price, created_at) VALUES
-- Product 1: iPhone 14 Pro Max
(1, 4, 21000000, '2025-12-06 10:00:00'),
(1, 5, 22000000, '2025-12-07 14:30:00'),
(1, 4, 23000000, '2025-12-08 09:15:00'),

-- Product 3: Google Pixel 7 Pro
(3, 9, 10500000, '2025-12-08 11:00:00'),
(3, 8, 11000000, '2025-12-09 16:20:00'),
(3, 9, 11200000, '2025-12-10 08:45:00'),

-- Product 5: Sony Xperia 1 IV
(5, 5, 14000000, '2025-12-05 12:00:00'),
(5, 7, 14500000, '2025-12-06 15:30:00'),
(5, 5, 15000000, '2025-12-07 10:00:00'),

-- Product 6: MacBook Pro 14
(6, 10, 30000000, '2025-12-02 09:00:00'),
(6, 8, 31500000, '2025-12-03 14:00:00'),
(6, 10, 33000000, '2025-12-04 11:30:00'),
(6, 10, 33500000, '2025-12-05 16:45:00'),

-- Product 8: Asus ROG Zephyrus
(8, 7, 23000000, '2025-12-03 10:00:00'),
(8, 9, 24000000, '2025-12-04 13:20:00'),
(8, 7, 25300000, '2025-12-05 09:30:00'),

-- Product 9: HP Spectre x360
(9, 8, 17000000, '2025-12-04 11:00:00'),
(9, 10, 18000000, '2025-12-05 14:45:00'),
(9, 8, 19200000, '2025-12-06 10:15:00'),

-- Product 11: Vintage Camera
(11, 12, 3500000, '2025-12-11 09:00:00'),
(11, 4, 4000000, '2025-12-12 14:00:00'),
(11, 12, 4500000, '2025-12-13 10:30:00'),

-- Product 12: Mechanical Keyboard
(12, 5, 2300000, '2025-12-12 11:00:00'),
(12, 7, 2600000, '2025-12-13 15:30:00'),
(12, 5, 2800000, '2025-12-14 09:45:00'),

-- Product 13: Gucci Bag
(13, 4, 8500000, '2025-12-13 10:00:00'),
(13, 9, 9000000, '2025-12-14 14:20:00'),
(13, 4, 9500000, '2025-12-15 11:00:00'),

-- Product 14: Nike Sneakers
(14, 7, 2800000, '2025-12-14 12:00:00'),
(14, 5, 3000000, '2025-12-15 16:30:00'),
(14, 7, 3200000, '2025-12-16 10:15:00'),

-- Product 15: Apple Watch Ultra
(15, 4, 16000000, '2025-12-15 09:00:00'),
(15, 9, 17000000, '2025-12-16 14:00:00'),
(15, 4, 17500000, '2025-12-17 10:30:00'),

-- Product 16: iPad Pro 12.9
(16, 10, 23000000, '2025-12-16 11:00:00'),
(16, 8, 24000000, '2025-12-17 15:00:00'),
(16, 10, 25000000, '2025-12-18 09:00:00'),

-- Product 17: Sony A7 IV
(17, 8, 36000000, '2025-12-17 10:00:00'),
(17, 10, 37000000, '2025-12-18 14:30:00'),
(17, 8, 38000000, '2025-12-19 11:00:00'),

-- Product 18: Louis Vuitton Wallet
(18, 9, 6500000, '2025-12-18 12:00:00'),
(18, 5, 6800000, '2025-12-19 16:00:00'),
(18, 9, 7200000, '2025-12-20 10:00:00'),

-- Product 19: Adidas Yeezy
(19, 7, 4500000, '2025-12-19 09:00:00'),
(19, 8, 4900000, '2025-12-20 14:00:00'),
(19, 7, 5200000, '2025-12-21 11:00:00'),

-- Product 20: Rolex Datejust
(20, 10, 82000000, '2025-12-20 10:00:00'),
(20, 4, 84000000, '2025-12-21 15:00:00'),
(20, 10, 85000000, '2025-12-22 09:30:00'),

-- Product 21: DJI Mavic 3
(21, 8, 26000000, '2025-12-21 11:00:00'),
(21, 9, 27000000, '2025-12-22 14:00:00'),
(21, 8, 28000000, '2025-12-23 10:00:00'),

-- Product 22: Dyson V15
(22, 5, 13000000, '2025-12-22 09:00:00'),
(22, 7, 14000000, '2025-12-23 13:00:00'),
(22, 5, 14500000, '2025-12-24 10:00:00'),

-- Product 24: Omega Seamaster
(24, 10, 48000000, '2025-12-24 11:00:00'),
(24, 8, 50000000, '2025-12-25 15:00:00'),
(24, 10, 52000000, '2025-12-26 10:00:00'),

-- Product 25: Herman Miller Aeron
(25, 8, 21000000, '2025-12-25 09:00:00'),
(25, 9, 22500000, '2025-12-26 14:00:00'),
(25, 8, 24000000, '2025-12-27 11:00:00');

-- ==========================================
-- 9. WATCHLISTS
-- ==========================================
INSERT INTO watchlists (user_id, product_id, created_at) VALUES 
(4, 1, '2025-12-05'),
(4, 4, '2025-12-06'),
(4, 13, '2025-12-13'),
(4, 20, '2025-12-20'),
(5, 1, '2025-12-05'),
(5, 6, '2025-12-03'),
(5, 22, '2025-12-22'),
(10, 6, '2025-12-02'),
(10, 20, '2025-12-20'),
(10, 24, '2025-12-24'),
(7, 8, '2025-12-02'),
(7, 14, '2025-12-14'),
(7, 19, '2025-12-19'),
(9, 3, '2025-12-08'),
(9, 18, '2025-12-18'),
(12, 11, '2025-12-11'),
(8, 17, '2025-12-17'),
(8, 21, '2025-12-21');

-- ==========================================
-- 10. PRODUCT DESCRIPTION UPDATES
-- ==========================================
INSERT INTO product_description_updates (product_id, content, created_at) VALUES 
(1, '<b>Update:</b> Tìm thấy hóa đơn mua hàng gốc, sẽ gửi kèm.', '2025-12-06'),
(6, '<b>Bổ sung:</b> Tặng kèm túi đựng laptop chính hãng Apple.', '2025-12-03'),
(13, '<b>Lưu ý:</b> Có thêm ảnh chi tiết mặt trong túi.', '2025-12-14'),
(20, '<b>Update:</b> Đã service tại Rolex VN, có giấy tờ.', '2025-12-21');

-- ==========================================
-- 11. SYSTEM SETTINGS
-- ==========================================
INSERT INTO system_settings (id, new_product_limit_minutes, auto_extend_trigger_minutes, auto_extend_duration_minutes) 
VALUES (1, 60, 5, 10);

COMMIT;
