import express from 'express';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';
import productRouter from './routes/product.route.js';
import categoryRouter from './routes/category.route.js';
import indexRouter from './routes/index.route.js';
import * as categoryModel from './models/category.model.js';

import accountRouter from './routes/account.route.js';

const app = express();
const PORT = process.env.PORT || 3005;

// Helper

app.engine('handlebars', engine({
  helpers: {
    section: expressHandlebarsSections(),
    eq(a, b) {
      return a === b;
    },
    format_number(price){
      return new Intl.NumberFormat('en-US').format(price);
    },
    format_date(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        // 'vi-VN' để ra định dạng ngày/tháng/năm
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh', // Ép buộc múi giờ VN
            hour12: false // Dùng định dạng 24h
        }).format(d);
    },
    time_remaining(date){
      const now = new Date();
      const end = new Date(date);
      const diff = end - now;
      if (diff <= 0) return '00:00:00';
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    },
    getPaginationRange(currentPage, totalPages) {
      const range = [];
      const maxVisible = 4;
      
      if (totalPages <= maxVisible) {
        // Nếu trang ít, hiển thị tất cả
        for (let i = 1; i <= totalPages; i++) {
          range.push({ number: i, type: 'number' });
        }
      } else {
        // Luôn hiển thị trang đầu
        range.push({ number: 1, type: 'number' });
        
        // Tính khoảng quanh trang hiện tại
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        // Nếu có khoảng cách từ 1 đến start
        if (start > 2) {
          range.push({ type: 'ellipsis' });
        }
        
        // Thêm các trang quanh trang hiện tại
        for (let i = start; i <= end; i++) {
          range.push({ number: i, type: 'number' });
        }
        
        // Nếu có khoảng cách từ end đến totalPages
        if (end < totalPages - 1) {
          range.push({ type: 'ellipsis' });
        }
        
        // Luôn hiển thị trang cuối
        range.push({ number: totalPages, type: 'number' });
      }
      
      return range;
    },
    and(...args) {
      return args.slice(0, -1).every(Boolean);
    },
    or(...args) {
      return args.slice(0, -1).some(Boolean);
    },
    gt(a, b) {
      return a > b;
    },
    lt(a, b) {
      return a < b;
    },
    add(a, b) {
      return a + b;
    },
    subtract(a, b) {
      return a - b;
    }
  }
}));

// Middleware to load categories for all views
app.use(async function (req, res, next) {
    const plist = await categoryModel.findLevel1Categories();
    const clist = await categoryModel.findLevel2Categories();
    res.locals.lcCategories1 = plist;
    res.locals.lcCategories2 = clist;
    next();
});

app.set('view engine', 'handlebars');
app.set('views', './views');


// Static files
app.use('/static', express.static('public'));
app.use('/category', categoryRouter);

// 🔴 PHẢI ĐỂ TRƯỚC ROUTES
app.use(express.urlencoded({ extended: true }));

// Session cũng nên để trước routes
app.use(session({
  secret: 'x8w3v9p2q1r7s6t5u4z0a8b7c6d5e4f3g2h1j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Routers
app.use('/products', productRouter);
app.use('/account', accountRouter);


// Route trang chủ
app.use('/', indexRouter);
app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});
