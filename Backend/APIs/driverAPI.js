const express = require('express');
const supabase = require('../services/supabaseClient');
const { verifyToken } = require('../middlewares/verifyToken');

const driverRouter = express.Router();

// Retrieve all drivers
driverRouter.get('/', verifyToken, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('Drivers Management')
      .select('*')
      .order('Id', { ascending: true });

    if (error) {
      error.status = 500;
      throw error;
    }

    res.status(200).json({ message: 'Drivers fetched successfully', payload: data });
  } catch (err) {
    next(err);
  }
});

// Create a new driver profile
driverRouter.post('/', verifyToken, async (req, res, next) => {
  try {
    const { Name, License_Number, License_Category, License_Expiry_Date, Contact_Number, Safety_Score, Status } = req.body;

    if (!Name || !License_Number || !License_Category || !License_Expiry_Date || !Contact_Number) {
      const error = new Error('All fields except Safety Score and Status are required');
      error.status = 400;
      throw error;
    }

    const { data, error } = await supabase
      .from('Drivers Management')
      .insert([
        {
          Name,
          License_Number,
          License_Category,
          License_Expiry_Date,
          Contact_Number,
          Safety_Score: Safety_Score !== undefined ? Number(Safety_Score) : 100,
          Status: Status || 'Available'
        }
      ])
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        const err = new Error('A driver with this License Number already exists');
        err.status = 400;
        throw err;
      }
      error.status = 500;
      throw error;
    }

    res.status(201).json({ message: 'Driver created successfully', payload: data });
  } catch (err) {
    next(err);
  }
});

// Update a driver profile
driverRouter.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Name, License_Number, License_Category, License_Expiry_Date, Contact_Number, Safety_Score, Status } = req.body;

    const updateFields = {};
    if (Name !== undefined) updateFields.Name = Name;
    if (License_Number !== undefined) updateFields.License_Number = License_Number;
    if (License_Category !== undefined) updateFields.License_Category = License_Category;
    if (License_Expiry_Date !== undefined) updateFields.License_Expiry_Date = License_Expiry_Date;
    if (Contact_Number !== undefined) updateFields.Contact_Number = Contact_Number;
    if (Safety_Score !== undefined) updateFields.Safety_Score = Number(Safety_Score);
    if (Status !== undefined) updateFields.Status = Status;

    const { data, error } = await supabase
      .from('Drivers Management')
      .update(updateFields)
      .eq('Id', id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        const err = new Error('A driver with this License Number already exists');
        err.status = 400;
        throw err;
      }
      error.status = 500;
      throw error;
    }

    if (!data) {
      const error = new Error('Driver not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json({ message: 'Driver updated successfully', payload: data });
  } catch (err) {
    next(err);
  }
});

// Delete a driver profile
driverRouter.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Drivers Management')
      .delete()
      .eq('Id', id)
      .select()
      .maybeSingle();

    if (error) {
      error.status = 500;
      throw error;
    }

    if (!data) {
      const error = new Error('Driver not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json({ message: 'Driver deleted successfully', payload: data });
  } catch (err) {
    next(err);
  }
});

module.exports = { driverRouter };
