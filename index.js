import express from 'express';
import { engine } from 'express-handlebars';
import productRouter from './routes/product.route.js';
import categoryRouter from './routes/category.route.js';
import * as categoryModel from './models/category.model.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Helper
app.engine('handlebars', engine({
    helpers: {
        eq(a, b) {
            return a === b;
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

app.use('/static', express.static('public'));
app.use('/category', categoryRouter);
app.use('/products', productRouter);

app.get('/', (req, res) => {
  res.render('home');
});

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});