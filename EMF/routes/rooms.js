const express = require('express');
const {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/rooms');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getRooms)
    .post(protect, createRoom);

router.route('/:id')
    .get(protect, getRoom)
    .put(protect, updateRoom)
    .delete(protect, deleteRoom);

module.exports = router;
