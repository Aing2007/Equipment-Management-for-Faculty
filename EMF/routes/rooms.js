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
    .post(protect, authorize('personnel'), createRoom);

router.route('/:id')
    .get(protect, getRoom)
    .put(protect, authorize('personnel'), updateRoom)
    .delete(protect, authorize('personnel'), deleteRoom);

module.exports = router;