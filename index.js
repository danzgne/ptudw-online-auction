import express from 'express';
import { engine } from 'express-handlebars';
import homeRoute from './routes/home.route.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/', homeRoute);
app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});