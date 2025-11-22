import express from 'express';
const router = express.Router();
router.get('/', (req, res) => {
    res.render('vmHome/home');
});
router.get('/menu', (req, res) => {
    res.render('vmHome/menu');
});

router.get('/list-product', (req, res) => {
    res.render('vmHome/list-product');
});


export default router;