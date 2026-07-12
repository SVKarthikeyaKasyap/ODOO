const express = require('express');
const { getAllVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } = require('../services/vehicleService');

const vehicleRouter = express.Router();

vehicleRouter.get('/', async (req, res, next) => {
  try {
    const payload = await getAllVehicles();
    res.status(200).json({ message: 'Vehicles fetched', payload });
  } catch (err) {
    next(err);
  }
});

vehicleRouter.get('/:id', async (req, res, next) => {
  try {
    const payload = await getVehicleById(req.params.id);
    res.status(200).json({ message: 'Vehicle fetched', payload });
  } catch (err) {
    next(err);
  }
});

vehicleRouter.post('/', async (req, res, next) => {
  try {
    const payload = await createVehicle(req.body);
    res.status(201).json({ message: 'Vehicle created', payload });
  } catch (err) {
    next(err);
  }
});

vehicleRouter.put('/:id', async (req, res, next) => {
  try {
    const payload = await updateVehicle(req.params.id, req.body);
    res.status(200).json({ message: 'Vehicle updated', payload });
  } catch (err) {
    next(err);
  }
});

vehicleRouter.delete('/:id', async (req, res, next) => {
  try {
    const payload = await deleteVehicle(req.params.id);
    res.status(200).json({ message: 'Vehicle deleted', payload });
  } catch (err) {
    next(err);
  }
});

module.exports = { vehicleRouter };