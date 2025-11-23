import express from 'express';
import * as categoryModel from '../models/category.model.js';

const router = express.Router();

// router.get('/', async function (req, res) {
//     const list = await categoryModel.findAll();
//     res.render('vwCategory/', {
//         categories: list
//     })
// });

export default router;
