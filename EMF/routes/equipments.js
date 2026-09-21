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
    .post(protect, authorize('personnel'), createEquipment);

router.route('/:id')
    .get(protect, getEquipment)
    .put(protect, authorize('personnel'), updateEquipment)
    .delete(protect, authorize('personnel'), deleteEquipment);

module.exports = router;