import db from '../utils/db.js';

export function findByCategoryId(id) {
    return db('categories').where('id', id).first();
}

export function findAll() {
    return db('categories');
}

export function findLevel1Categories() {
    return db('categories').
        where('parent_id', null);
}

export function findLevel2Categories() {
    return db('categories').
        whereNot('parent_id', null);
}