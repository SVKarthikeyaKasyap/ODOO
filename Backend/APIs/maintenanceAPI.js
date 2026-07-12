const express = require('express')
const { createMaintenance } = require('../services/maintenanceService')

const maintenanceRouter = express.Router()

maintenanceRouter.post('/', async (req, res, next) => {
  try {
    const payload = await createMaintenance(req.body)
    res.status(201).json({ message: 'Maintenance record created', payload })
  } catch (err) {
    next(err)
  }
})

module.exports = { maintenanceRouter }
