import express from 'express';
import * as productModel from '../models/product.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.get('/', async function (req, res) {
    res.render('vwSeller/dashboard');
});

router.get('/products/add', async function (req, res) {
    res.render('vwSeller/add');
});

router.post('/products/add', async function (req, res) {
    const product = req.body;
    // console.log('product:', product);
    const sellerId = req.session.authUser.id;
    // console.log('sellerId:', sellerId);
    const productData = {
        seller_id: sellerId,
        category_id: product.category_id,
        name: product.name,
        starting_price: product.start_price.replace(/,/g, ''),
        step_price: product.step_price.replace(/,/g, ''),
        buy_now_price: product.buy_now_price !== '' ? product.buy_now_price.replace(/,/g, '') : null,
        created_at: product.created_at,
        end_at: product.end_date,
        auto_extend: product.auto_extend === '1' ? true : false,
        thumbnail: null,  // to be updated after upload
        description: product.description,
        highest_bidder_id: null,
        current_price: product.start_price.replace(/,/g, ''),
        is_sold: false,
        allow_unrated_bidder: product.allow_new_bidders === '1' ? true : false
    }
    console.log('productData:', productData);
    const returnedID = await productModel.addProduct(productData);

    const dirPath = path.join('public', 'images', 'products').replace(/\\/g, "/");

    const imgs = JSON.parse(product.imgs_list);
    // const subimagesData = imgs.map(imgUrl => ({
    //     product_id: returnedID[0].id,
    //     img_link: imgUrl
    // }));

    // Move and rename thumbnail
    const mainPath = path.join(dirPath, `p${returnedID[0].id}_thumb.jpg`).replace(/\\/g, "/");
    const oldMainPath = path.join('public', 'uploads', path.basename(product.thumbnail)).replace(/\\/g, "/");
    const savedMainPath = '/' + path.join('images', 'products', `p${returnedID[0].id}_thumb.jpg`).replace(/\\/g, "/");
    fs.renameSync(oldMainPath, mainPath);
    await productModel.updateProductThumbnail(returnedID[0].id, savedMainPath);

    // Move and rename subimages 
    let i = 1;
    let newImgPaths = [];
    for (const imgPath of imgs) {
        const oldPath = path.join('public', 'uploads', path.basename(imgPath)).replace(/\\/g, "/");
        const newPath = path.join(dirPath, `p${returnedID[0].id}_${i}.jpg`).replace(/\\/g, "/");
        const savedPath = '/' + path.join('images', 'products', `p${returnedID[0].id}_${i}.jpg`).replace(/\\/g, "/");
        fs.renameSync(oldPath, newPath);
        newImgPaths.push({
            product_id: returnedID[0].id,
            img_link: savedPath
        });
        i++;
    }

    console.log('subimagesData:', newImgPaths);
    await productModel.addProductImages(newImgPaths);
    // res.redirect('/seller');
    res.send("Product added successfully!");
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/products/upload-thumbnail', upload.single('thumbnail'), async function (req, res) {
    res.json({
        success: true,
        file: req.file
    });
});

router.post('/products/upload-subimages', upload.array('images', 10), async function (req, res) {
    res.json({
        success: true,
        files: req.files
    });
});

export default router;