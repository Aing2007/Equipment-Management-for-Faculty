const express = require('express');
const {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/rooms');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getRooms)
    .post(protect, authorize('admin', 'personnel'), createRoom);

router.route('/:id')
    .get(protect, getRoom)
    .put(protect, authorize('admin', 'personnel'), updateRoom)
    .delete(protect, authorize('admin', 'personnel'), deleteRoom);

module.exports = router;
