================================================================================
                    HƯỚNG DẪN TRIỂN KHAI DỰ ÁN ĐẤU GIÁ TRỰC TUYẾN
                           (Online Auction Platform)
================================================================================

Dự án được xây dựng với:
- Backend: Node.js + Express.js
- Frontend: Handlebars (Server-Side Rendering)
- Database: PostgreSQL
- Authentication: Passport.js (Local, Google, Facebook, GitHub)

================================================================================
                              CẤU TRÚC THƯ MỤC
================================================================================

Bạn hãy giải nén 2 thư mục này:

📁 src/          - Mã nguồn backend và frontend
📁 db/           - Các script SQL để thiết lập database

================================================================================
                         PHẦN 1: YÊU CẦU HỆ THỐNG
================================================================================

Trước khi bắt đầu, đảm bảo máy tính đã cài đặt:

1. Node.js (phiên bản 18.x trở lên)
   - Tải từ: https://nodejs.org/
   - Kiểm tra: node --version

2. Tài khoản Supabase (miễn phí)
   - Đăng ký tại: https://supabase.com/

3. Git (tùy chọn)
   - Tải từ: https://git-scm.com/

================================================================================
                         PHẦN 2: THIẾT LẬP DATABASE (Supabase)
================================================================================

Database được host trên Supabase (https://supabase.com/)

BƯỚC 1: Tạo tài khoản và Project trên Supabase
----------------------------------------------
1. Truy cập https://supabase.com/ và đăng ký tài khoản (miễn phí)
2. Tạo một Project mới:
   - Nhấn "New Project"
   - Đặt tên Project (ví dụ: online-auction)
   - Đặt Database Password (LƯU LẠI MẬT KHẨU NÀY!)
   - Chọn Region gần nhất (Singapore hoặc Southeast Asia)
   - Nhấn "Create new project" và đợi 1-2 phút

BƯỚC 2: Lấy thông tin kết nối Database
--------------------------------------
1. Vào Project vừa tạo
2. Nhấn vào "Project Settings" (biểu tượng bánh răng) ở sidebar trái
3. Chọn "Database" trong menu
4. Kéo xuống phần "Connection string" > chọn tab "URI"
5. Copy connection string, có dạng:
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

Hoặc lấy từng thông tin riêng lẻ:
   - Host: aws-0-[region].pooler.supabase.com (hoặc db.[project-ref].supabase.co)
   - Port: 5432 (hoặc 6543 cho connection pooling)
   - Database: postgres
   - User: postgres.[project-ref]
   - Password: mật khẩu bạn đã tạo ở bước 1

BƯỚC 3: Chạy các script SQL trên Supabase
-----------------------------------------
1. Trong Supabase Dashboard, nhấn "SQL Editor" ở sidebar trái
2. Nhấn "New query"
3. Mở từng file SQL trong thư mục db/ và copy nội dung vào SQL Editor
4. Chạy theo thứ tự sau (nhấn "Run" hoặc Ctrl+Enter):

    1. create-table.sql      - Tạo cấu trúc bảng và các kiểu dữ liệu
    2. mask-name.sql         - Tạo function mã hóa tên người dùng
    3. full-text-search.sql  - Thêm Full-Text Search cho sản phẩm
    4. add-oauth-support.sql - Thêm hỗ trợ đăng nhập OAuth
    5. insert-data.sql       - Thêm dữ liệu mẫu (tùy chọn)

Lưu ý: Mỗi file chạy xong phải thấy "Success" trước khi chạy file tiếp theo!

================================================================================
                         PHẦN 3: THIẾT LẬP BACKEND
================================================================================

BƯỚC 1: Di chuyển vào thư mục src
---------------------------------
    cd src

BƯỚC 2: Cài đặt dependencies
----------------------------
    npm install

Lệnh này sẽ cài đặt tất cả packages cần thiết từ file package.json

BƯỚC 3: Tạo file cấu hình môi trường
------------------------------------
Tạo file .env trong thư mục src/ với nội dung sau:

------- BẮT ĐẦU FILE .env -------

# Database Configuration (Supabase)
# Lấy thông tin từ Supabase Dashboard > Project Settings > Database
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.your_project_ref
DB_PASSWORD=your_supabase_password
DB_NAME=postgres

# Session Secret (thay đổi giá trị này!)
SESSION_SECRET=your_super_secret_key_here_change_this

# Server Configuration
PORT=3005
BASE_URL=http://localhost:3005

# Email Configuration (Gmail với App Password)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_16_char_app_password

# OAuth Configuration (Tùy chọn - để đăng nhập bằng mạng xã hội)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

------- KẾT THÚC FILE .env -------

BƯỚC 4: Cấu hình kết nối Database (Supabase)
--------------------------------------------
Mở file utils/db.js và cập nhật thông tin kết nối:

    import knex from 'knex';
    export default knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres'
      },
      pool: { min: 0, max: 7 }
    });

Lưu ý: Thay các giá trị DB_HOST, DB_USER, DB_PASSWORD bằng thông tin
từ Supabase Dashboard của bạn.

================================================================================
                         PHẦN 4: CHẠY ỨNG DỤNG
================================================================================

BƯỚC 1: Khởi động server
------------------------
Trong thư mục src/, chạy lệnh:

    npm run dev

Server sẽ khởi động với nodemon (tự động restart khi có thay đổi)

BƯỚC 2: Truy cập ứng dụng
-------------------------
Mở trình duyệt và truy cập:

    http://localhost:3005

================================================================================
                         PHẦN 5: CẤU HÌNH EMAIL (Quan trọng)
================================================================================

Để gửi email thông báo, bạn cần cấu hình Gmail App Password:

1. Đăng nhập vào Gmail của bạn
2. Vào: https://myaccount.google.com/security
3. Bật "Xác minh 2 bước" (2-Step Verification)
4. Sau khi bật, vào: https://myaccount.google.com/apppasswords
5. Chọn "Mail" và "Windows Computer"
6. Nhấn "Generate" để tạo App Password (16 ký tự)
7. Copy password này vào MAIL_PASS trong file .env

Lưu ý: KHÔNG sử dụng mật khẩu Gmail thông thường, phải dùng App Password!

================================================================================
                    PHẦN 6: CẤU HÌNH OAUTH (Tùy chọn)
================================================================================

Nếu muốn đăng nhập bằng Google/Facebook/GitHub:

GOOGLE:
-------
1. Vào https://console.developers.google.com/
2. Tạo project mới
3. Vào "Credentials" > "Create Credentials" > "OAuth client ID"
4. Chọn "Web application"
5. Thêm Authorized redirect URIs:
   http://localhost:3005/account/auth/google/callback
6. Copy Client ID và Client Secret vào file .env

FACEBOOK:
---------
1. Vào https://developers.facebook.com/
2. Tạo App mới
3. Thêm "Facebook Login" product
4. Cấu hình Valid OAuth Redirect URIs:
   http://localhost:3005/account/auth/facebook/callback
5. Copy App ID và App Secret vào file .env

GITHUB:
-------
1. Vào https://github.com/settings/developers
2. Tạo "New OAuth App"
3. Authorization callback URL:
   http://localhost:3005/account/auth/github/callback
4. Copy Client ID và Client Secret vào file .env

================================================================================
                         PHẦN 7: TÀI KHOẢN MẪU
================================================================================

Nếu bạn đã chạy insert-data.sql, có thể đăng nhập với các tài khoản sau:

+---------------------------+------------------+----------+
| Email                     | Mật khẩu         | Vai trò  |
+---------------------------+------------------+----------+
| john.seller@store.com     | 123              | Admin    |
| sarah.boutique@uk.com     | 123              | Seller   |
| mike.trader@au.com        | 123              | Seller   |
| david.vip@gmail.com       | 123              | Bidder   |
| emily.w@yahoo.com         | 123              | Bidder   |
+---------------------------+------------------+----------+

(Mật khẩu mặc định trong dữ liệu mẫu là: 123)

================================================================================
                         PHẦN 8: CẤU TRÚC DỰ ÁN
================================================================================

src/
├── index.js              # Entry point - khởi động server
├── package.json          # Dependencies và scripts
├── .env                  # Cấu hình môi trường (tự tạo)
│
├── database/             # SQL scripts
├── middlewares/          # Express middlewares
├── models/               # Database models (Knex queries)
├── routes/               # Express routes
├── scripts/              # Background jobs (auction notifier)
├── utils/                # Utilities (db, mailer, passport)
│
├── public/               # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   ├── images/           # Images
│   └── uploads/          # User uploads
│
└── views/                # Handlebars templates
    ├── layouts/          # Layout templates
    ├── partials/         # Partial templates
    ├── vwAccount/        # Account pages
    ├── vwAdmin/          # Admin pages
    ├── vwProduct/        # Product pages
    └── vwSeller/         # Seller pages

================================================================================
                         PHẦN 9: XỬ LÝ LỖI THƯỜNG GẶP
================================================================================

LỖI 1: "Cannot find module..."
------------------------------
Nguyên nhân: Chưa cài đặt dependencies
Giải pháp: Chạy lại "npm install"

LỖI 2: "Connection refused" hoặc "ECONNREFUSED"
-----------------------------------------------
Nguyên nhân: Cấu hình kết nối Supabase sai
Giải pháp: 
  - Kiểm tra thông tin kết nối trong file .env
  - Đảm bảo DB_HOST, DB_USER, DB_PASSWORD đúng với Supabase Dashboard
  - Kiểm tra kết nối internet

LỖI 3: "Relation does not exist"
--------------------------------
Nguyên nhân: Chưa tạo bảng trong database
Giải pháp: Chạy các file SQL trong thư mục db/

LỖI 4: "SMTP ERROR" hoặc email không gửi được
---------------------------------------------
Nguyên nhân: Cấu hình email sai
Giải pháp:
  - Kiểm tra đã bật 2-Step Verification
  - Sử dụng App Password (16 ký tự), không dùng mật khẩu thường
  - Kiểm tra MAIL_USER và MAIL_PASS trong .env

LỖI 5: "Port 3005 already in use"
---------------------------------
Nguyên nhân: Đã có ứng dụng khác chạy trên port 3005
Giải pháp:
  - Đổi PORT trong .env sang số khác (vd: 3006)
  - Hoặc tắt ứng dụng đang dùng port 3005


================================================================================
                           CHÚC BẠN TRIỂN KHAI THÀNH CÔNG!
================================================================================
