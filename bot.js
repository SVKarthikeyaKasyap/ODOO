const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const supabase = createClient(
    'https://fnhkgnbadrajrlpfjahv.supabase.co',
    'sb_publishable_d8cpzjZRblQcsmE4zyRX_g_1KOjFpVO'
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let activeTableName = 'vehicle flow';

async function determineActiveTable() {
    let { error } = await supabase.from('vehicle flow').select('name').limit(1);
    if (!error) return 'vehicle flow';
    ({ error } = await supabase.from('Vehicle Flow').select('name').limit(1));
    if (!error) return 'Vehicle Flow';
    ({ error } = await supabase.from('Vehicle Registration').select('name').limit(1));
    if (!error) return 'Vehicle Registration';
    return 'vehicle flow'; // Default fallback
}

async function predictLocation() {
    console.log('Running AI location prediction cycle...');
    activeTableName = await determineActiveTable();
    
    // Fetch active vehicles
    const { data: vehicles, error } = await supabase
        .from(activeTableName)
        .select('*')
        .eq('status', 'active');
        
    if (error) {
        console.error('Error fetching vehicles:', error);
        return;
    }
    
    if (!vehicles || vehicles.length === 0) {
        console.log('No active vehicles found.');
        return;
    }
    
    for (const vehicle of vehicles) {
        if (!vehicle['Start Location'] || !vehicle['End Location'] || !vehicle['Start Time'] || !vehicle['End Time']) {
            continue;
        }

        const prompt = `
A cargo truck is traveling from "${vehicle['Start Location']}" to "${vehicle['End Location']}".
It started its journey at "${vehicle['Start Time']}" and is expected to arrive at "${vehicle['End Time']}".
The current time is "${new Date().toISOString()}".
Based on a typical route between these locations and the elapsed time relative to the total duration, estimate its current location as accurately as possible. 
Provide ONLY the name of the current city, highway, or landmark. Do not provide coordinates or any extra explanation.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const predictedLocation = response.text.trim();
            console.log(`Predicted location for ${vehicle.name}: ${predictedLocation}`);
            
            // Update the database
            const { error: updateError } = await supabase
                .from(activeTableName)
                .update({ 'Current Location': predictedLocation })
                .eq('name', vehicle.name); // Using name as identifier, assuming it's unique. Adjust if you have an id.
                
            if (updateError) {
                console.error(`Failed to update ${vehicle.name}:`, updateError);
            }
        } catch (aiError) {
            console.error(`AI Prediction error for ${vehicle.name}:`, aiError);
        }
    }
}

function startBot() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY not found in .env. The AI bot will not run correctly.");
    } else {
        console.log('🤖 AI Prediction Bot started.');
        // Run immediately, then every 60 seconds
        predictLocation();
        setInterval(predictLocation, 60000);
    }
}

module.exports = { startBot };
