const supabase = require('./supabaseClient')

async function createMaintenance(payload) {
  const { data: newMaintenance, error: insertError } = await supabase
    .from('Maintenance Log')
    .insert([payload])
    .select()
    .single()

  if (insertError || !newMaintenance) {
    console.error('Supabase CreateMaintenance Error:', insertError)
    const error = new Error(insertError?.message || 'Error creating maintenance record in database')
    error.status = 500
    throw error
  }

  const { data: updatedVehicle, error: updateError } = await supabase
    .from('Vehicle Registry')
    .update({ Status: 'In Shop' })
    .eq('Registration Number', payload['Registration Number'])
    .select()
    .single()

  if (updateError) {
    console.error('Supabase UpdateVehicleStatus Error:', updateError)
    const error = new Error(updateError?.message || 'Error updating vehicle status in database')
    error.status = 500
    throw error
  }

  if (!updatedVehicle) {
    const error = new Error('Vehicle not found for provided Registration Number')
    error.status = 404
    throw error
  }

  return newMaintenance
}

module.exports = { createMaintenance }
