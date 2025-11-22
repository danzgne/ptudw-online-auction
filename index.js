import express from 'express';
import { engine } from 'express-handlebars';
import productRouter from './routes/product.route.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use('/static', express.static('public'));
app.use('/products', productRouter);
app.get('/', (req, res) => {
  res.render('home');
});
app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});