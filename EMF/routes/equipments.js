const express = require('express');
const {
    getEquipments,
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require('../controllers/equipments');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getEquipments)
    .post(protect, authorize('admin', 'personnel'), createEquipment);

router.route('/:id')
    .get(protect, getEquipment)
    .put(protect, authorize('admin', 'personnel'), updateEquipment)
    .delete(protect, authorize('admin', 'personnel'), deleteEquipment);

module.exports = router;
