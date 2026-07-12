const supabase = require('./supabaseClient');

async function getAllVehicles() {
  const { data: vehicles, error: fetchError } = await supabase
    .from('Vehicle Registry')
    .select('*');

  if (fetchError) {
    console.error('Supabase GetAllVehicles Error:', fetchError);
    const error = new Error(fetchError?.message || 'Error fetching vehicles from database');
    error.status = 500;
    throw error;
  }

  return vehicles;
}

async function getVehicleById(registrationNumber) {
  const { data: vehicle, error: fetchError } = await supabase
    .from('Vehicle Registry')
    .select('*')
    .eq('Registration Number', registrationNumber)
    .maybeSingle();

  if (fetchError) {
    console.error('Supabase GetVehicleById Error:', fetchError);
    const error = new Error(fetchError?.message || 'Error fetching vehicle from database');
    error.status = 500;
    throw error;
  }

  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.status = 404;
    throw error;
  }

  return vehicle;
}

async function createVehicle(payload) {
  const { data: newVehicle, error: insertError } = await supabase
    .from('Vehicle Registry')
    .insert([payload])
    .select()
    .single();

  if (insertError || !newVehicle) {
    console.error('Supabase CreateVehicle Error:', insertError);
    const error = new Error(insertError?.message || 'Error creating vehicle in database');
    error.status = 500;
    throw error;
  }

  return newVehicle;
}

async function updateVehicle(registrationNumber, payload) {
  const { data: updatedVehicle, error: updateError } = await supabase
    .from('Vehicle Registry')
    .update(payload)
    .eq('Registration Number', registrationNumber)
    .select()
    .single();

  if (updateError || !updatedVehicle) {
    console.error('Supabase UpdateVehicle Error:', updateError);
    const error = new Error(updateError?.message || 'Error updating vehicle in database');
    error.status = 500;
    throw error;
  }

  return updatedVehicle;
}

async function deleteVehicle(registrationNumber) {
  const { data: deletedVehicle, error: deleteError } = await supabase
    .from('Vehicle Registry')
    .delete()
    .eq('Registration Number', registrationNumber)
    .select()
    .single();

  if (deleteError || !deletedVehicle) {
    console.error('Supabase DeleteVehicle Error:', deleteError);
    const error = new Error(deleteError?.message || 'Error deleting vehicle from database');
    error.status = 500;
    throw error;
  }

  return deletedVehicle;
}

module.exports = { getAllVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };