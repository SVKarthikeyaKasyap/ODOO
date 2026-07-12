const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Drivers Management')
      .select('*')
      .order('Id', { ascending: true });

    if (error) throw error;
    res.json({ payload: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/drivers
app.post('/api/drivers', async (req, res) => {
  try {
    const { Name, License_Number, License_Category, License_Expiry_Date, Contact_Number, Safety_Score, Status } = req.body;
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

    if (error) throw error;
    res.status(201).json({ message: 'Driver created successfully', payload: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/drivers/:id
app.put('/api/drivers/:id', async (req, res) => {
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

    if (error) throw error;
    res.json({ message: 'Driver updated successfully', payload: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/drivers/:id
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('Drivers Management')
      .delete()
      .eq('Id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.json({ message: 'Driver deleted successfully', payload: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Standalone Backend running on port ${PORT}`);
});
