const express = require('express');
const {
    getEquipments,
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require('../controllers/equipments');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getEquipments)
    .post(protect, createEquipment);

router.route('/:id')
    .get(protect, getEquipment)
    .put(protect, updateEquipment)
    .delete(protect, deleteEquipment);

module.exports = router;
