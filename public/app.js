// TransitOps - GIS Live Map & Routing Script

const TT_KEY = 'YOUR_TOMTOM_API_KEY';

// Supabase DB Configuration
const SUPABASE_URL = 'https://fnhkgnbadrajrlpfjahv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d8cpzjZRblQcsmE4zyRX_g_1KOjFpVO';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Gemini AI Key
const GEMINI_API_KEY = ''; // REMOVED FOR PUSH - DO NOT COMMIT SECRETS

// State
let mapInstance = null;
let mapType     = 'leaflet';
let startMarker = null;
let endMarker   = null;
let startPos    = null;
let endPos      = null;
let routeLayer  = null;
let trafficInterval = null;
let selectingStart  = false;
let assignTasksMode = false;
let selectedAssignTruck = null;
let dbMarkers   = [];
let activeTableName = 'vehicle flow';

// ─── STATUS BANNER ──────────────────────────────────────────────────────────
function createStatusBanner() {
    if (document.getElementById('status-banner')) return;
    const b = document.createElement('div');
    b.id = 'status-banner';
    b.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
        background:#0ea5e9;color:#fff;padding:10px 24px;border-radius:24px;
        font-family:Inter,sans-serif;font-size:13px;font-weight:600;
        z-index:99999;display:none;max-width:90%;text-align:center;
        box-shadow:0 4px 20px rgba(0,0,0,0.5);transition:all 0.3s;`;
    document.body.appendChild(b);
}
function setStatus(msg, color) {
    const b = document.getElementById('status-banner');
    if (!b) return;
    if (!msg) { b.style.display = 'none'; return; }
    b.style.background = color || '#0ea5e9';
    b.innerText = msg;
    b.style.display = 'block';
}

// ─── INIT ────────────────────────────────────────────────────────────────────
window.onload = () => {
    createStatusBanner();
    initGISMap();
    setupAutocomplete();
    setupControlButtons();
    setupAssignUI();
};

// ─── MAP INIT ────────────────────────────────────────────────────────────────
function initGISMap() {
    document.getElementById('provider-text').innerText = 'Acquiring GPS Position...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                startPos = [pos.coords.longitude, pos.coords.latitude];
                document.getElementById('map-start-location').value = 'Browser GPS Position';
                bootstrapMap(startPos);
            },
            () => {
                startPos = [78.4747, 17.3616];
                document.getElementById('map-start-location').value = 'Hyderabad (Default)';
                bootstrapMap(startPos);
            }
        );
    } else {
        startPos = [78.4747, 17.3616];
        document.getElementById('map-start-location').value = 'Hyderabad (Default)';
        bootstrapMap(startPos);
    }
}

function bootstrapMap(center) {
    const isTomTomValid = TT_KEY && TT_KEY !== 'YOUR_TOMTOM_API_KEY';
    if (isTomTomValid) {
        try {
            mapType = 'tomtom';
            document.getElementById('provider-text').innerText = 'TomTom Map Engine Active';
            document.getElementById('provider-status').className = 'glass-panel';
            mapInstance = tt.map({ key: TT_KEY, container: 'map', center, zoom: 13,
                stylesVisibility: { trafficFlow: true, trafficIncidents: true } });
            mapInstance.addControl(new tt.NavigationControl());
            startMarker = new tt.Marker({ color: '#0ea5e9' }).setLngLat(center).addTo(mapInstance);
            mapInstance.on('click', e => handleMapClick([e.lngLat.lng, e.lngLat.lat]));
            mapInstance.on('load', () => { loadDatabaseMarkers(); });
        } catch (err) { loadLeafletMap(center); }
    } else {
        loadLeafletMap(center);
    }
}

function loadLeafletMap(center) {
    mapType = 'leaflet';
    document.getElementById('provider-text').innerText  = 'Leaflet OSM Fallback Active';
    document.getElementById('provider-status').className = 'glass-panel fallback';
    const latLng = [center[1], center[0]];
    mapInstance = L.map('map').setView(latLng, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);
    startMarker = L.marker(latLng, { icon: leafletIcon('#0ea5e9') }).addTo(mapInstance);
    mapInstance.on('click', e => handleMapClick([e.latlng.lng, e.latlng.lat]));
    loadDatabaseMarkers();
}

function leafletIcon(colorHex) {
    const color = colorHex === '#0ea5e9' ? 'blue' : 'red';
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41]
    });
}

// ─── MAP CLICK ───────────────────────────────────────────────────────────────
function handleMapClick(lngLat) {
    if (selectingStart) {
        startPos = lngLat;
        setStartMarkerPos(lngLat);
        selectingStart = false;
        document.getElementById('btnChangeStart').innerText = 'Change';
        document.getElementById('btnChangeStart').className = 'btn btn-secondary';
        reverseGeocode(lngLat, 'map-start-location');
        if (endPos) calculateRoute();
    } else {
        endPos = lngLat;
        setEndMarkerPos(lngLat);
        reverseGeocode(lngLat, 'searchDest');
        calculateRoute();
    }
}

function setStartMarkerPos(lngLat) {
    if (mapType === 'tomtom') startMarker.setLngLat(lngLat);
    else startMarker.setLatLng([lngLat[1], lngLat[0]]);
}

function setEndMarkerPos(lngLat) {
    if (mapType === 'tomtom') {
        if (!endMarker) endMarker = new tt.Marker({ color: '#ef4444' }).setLngLat(lngLat).addTo(mapInstance);
        else endMarker.setLngLat(lngLat);
    } else {
        if (!endMarker) endMarker = L.marker([lngLat[1], lngLat[0]], { icon: leafletIcon('#ef4444') }).addTo(mapInstance);
        else endMarker.setLatLng([lngLat[1], lngLat[0]]);
    }
}

// ─── AUTOCOMPLETE ────────────────────────────────────────────────────────────
function setupAutocomplete() {
    const input = document.getElementById('searchDest');
    const list  = document.getElementById('search-autocomplete-list');
    let debounce = null;

    input.addEventListener('input', () => {
        clearTimeout(debounce);
        const query = input.value.trim();
        if (!query || query.length < 3) { list.style.display = 'none'; return; }
        debounce = setTimeout(() => {
            if (mapType === 'tomtom') {
                tt.services.fuzzySearch({ key: TT_KEY, query, center: startPos }).then(res => {
                    list.innerHTML = '';
                    if (res.results && res.results.length > 0) {
                        list.style.display = 'block';
                        res.results.slice(0,5).forEach(item => {
                            const li = document.createElement('li');
                            li.innerText = item.address.freeformAddress;
                            li.onclick = () => selectSearchLocation([item.position.lng, item.position.lat], item.address.freeformAddress);
                            list.appendChild(li);
                        });
                    }
                });
            } else {
                fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`)
                    .then(r => r.json()).then(data => {
                        list.innerHTML = '';
                        if (data && data.length > 0) {
                            list.style.display = 'block';
                            data.forEach(item => {
                                const li = document.createElement('li');
                                const name = item.display_name.split(',').slice(0,4).join(',');
                                li.innerText = name;
                                li.onclick = () => selectSearchLocation([parseFloat(item.lon), parseFloat(item.lat)], name);
                                list.appendChild(li);
                            });
                        }
                    });
            }
        }, 400);
    });
    document.addEventListener('click', e => { if (e.target !== input) list.style.display = 'none'; });
}

function selectSearchLocation(lngLat, name) {
    document.getElementById('searchDest').value = name;
    document.getElementById('search-autocomplete-list').style.display = 'none';
    endPos = lngLat;
    if (mapType === 'tomtom') mapInstance.setCenter(lngLat);
    else mapInstance.setView([lngLat[1], lngLat[0]], 13);
    setEndMarkerPos(lngLat);
    calculateRoute();
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────
function calculateRoute() {
    if (!startPos || !endPos) return;
    const travelMode = document.getElementById('travelMode') ? document.getElementById('travelMode').value : 'car';

    if (mapType === 'tomtom') {
        const opts = { key: TT_KEY, locations: `${startPos[0]},${startPos[1]}:${endPos[0]},${endPos[1]}`,
            traffic: true, travelMode, computeTravelTimeFor: 'all' };
        if (travelMode === 'truck') {
            opts.vehicleWidth = 2.5; opts.vehicleHeight = 3.8;
            opts.vehicleLength = 10.0; opts.vehicleWeight = 12000; opts.vehicleCommercial = true;
        }
        tt.services.calculateRoute(opts).then(res => {
            const route = res.routes[0];
            drawRoutePolyline(route.legs[0].points.map(p => [p.lng, p.lat]));
            updateSummary(route.summary);
            updateIncidentsPanel(route.summary.lengthInMeters);
        }).catch(err => console.error('TomTom Routing failed:', err));
    } else {
        fetch(`https://router.project-osrm.org/route/v1/driving/${startPos[0]},${startPos[1]};${endPos[0]},${endPos[1]}?geometries=geojson&overview=full`)
            .then(r => r.json()).then(data => {
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    drawRoutePolyline(route.geometry.coordinates);
                    let dur = route.duration;
                    let delay = 0;
                    if (travelMode === 'truck') { dur *= 1.25; delay = Math.floor(route.distance/1000)*14+60; }
                    else if (travelMode === 'motorcycle') { dur *= 0.9; delay = Math.floor(route.distance/1000)*3+15; }
                    else { delay = Math.floor(route.distance/1000)*10+40; }
                    const arrival = new Date(Date.now() + (dur+delay)*1000);
                    updateSummary({ lengthInMeters: route.distance, travelTimeInSeconds: dur+delay,
                        trafficDelayInSeconds: delay, arrivalTime: arrival.toISOString() });
                    updateIncidentsPanel(route.distance);
                }
            }).catch(err => console.error('OSRM Fallback failed:', err));
    }
    if (trafficInterval) clearInterval(trafficInterval);
    trafficInterval = setInterval(calculateRoute, 30000);
}

function drawRoutePolyline(points) {
    if (mapType === 'tomtom') {
        if (mapInstance.getLayer('route')) { mapInstance.removeLayer('route'); mapInstance.removeSource('route'); }
        mapInstance.addSource('route', { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates: points }}});
        mapInstance.addLayer({ id:'route', type:'line', source:'route', paint:{ 'line-color':'#0ea5e9','line-width':6 }});
        const bounds = new tt.LngLatBounds();
        points.forEach(p => bounds.extend(p));
        mapInstance.fitBounds(bounds, { padding: 50 });
    } else {
        if (routeLayer) mapInstance.removeLayer(routeLayer);
        const latLngs = points.map(p => [p[1], p[0]]);
        routeLayer = L.polyline(latLngs, { color:'#0ea5e9', weight:6, opacity:0.8 }).addTo(mapInstance);
        mapInstance.fitBounds(L.latLngBounds(latLngs), { padding: [50,50] });
    }
}

function updateSummary(summary) {
    const distKm = (summary.lengthInMeters / 1000).toFixed(2);
    const durMin = Math.floor(summary.travelTimeInSeconds / 60);
    const delMin = Math.floor(summary.trafficDelayInSeconds / 60);
    const speed  = Math.round(parseFloat(distKm) / (summary.travelTimeInSeconds / 3600));
    const arrival = new Date(summary.arrivalTime).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    document.getElementById('route-summary').style.display = 'block';
    document.getElementById('lblDist').innerText    = distKm + ' km';
    document.getElementById('lblArrival').innerText = arrival;
    document.getElementById('lblSpeed').innerText   = speed + ' km/h';
    document.getElementById('lblTime').innerText    = durMin + ' min';
    const dl = document.getElementById('lblDelay');
    if (delMin < 2)       { dl.innerText = delMin+' min (Green - Smooth)';   dl.style.color='var(--success)'; }
    else if (delMin < 5)  { dl.innerText = delMin+' min (Yellow - Moderate)';dl.style.color='var(--warning)'; }
    else if (delMin < 10) { dl.innerText = delMin+' min (Orange - Heavy)';   dl.style.color='#f97316'; }
    else                  { dl.innerText = delMin+' min (Red - Gridlock)';   dl.style.color='var(--danger)'; }
    const travelMode = document.getElementById('travelMode') ? document.getElementById('travelMode').value : 'car';
    const w = document.getElementById('routing-warning');
    if (w) {
        w.style.display = 'block';
        if (travelMode === 'truck') w.innerText = '⚠️ Truck Mode: Heavy freight route selected.';
        else if (travelMode === 'motorcycle') w.innerText = '🏍️ Motorbike Mode: Lane filtering enabled.';
        else w.innerText = '🚗 Car Mode: Standard road routing.';
    }
}

function updateIncidentsPanel(distanceMeters) {
    const panel = document.getElementById('incidents-panel');
    const list  = document.getElementById('incidents-list');
    list.innerHTML = '';
    if (distanceMeters > 3000) {
        panel.style.display = 'block';
        const mockIncidents = [
            { type:'Accident',     desc:'Minor collision. Left lane blocked.',      severity:'medium' },
            { type:'Road Closure', desc:'Maintenance works. Detour in place.',      severity:'high'   },
            { type:'Construction', desc:'Metro extension work. Reduced speed limit.',severity:'medium' },
            { type:'Congestion',   desc:'Heavy traffic volume. Stop-and-go delays.',severity:'medium' }
        ];
        const n = Math.floor(Math.random()*2)+1;
        mockIncidents.sort(()=>0.5-Math.random()).slice(0,n).forEach(inc => {
            const item = document.createElement('div');
            item.className = 'incident-item';
            item.innerHTML = `<span class="incident-severity severity-${inc.severity}">${inc.severity} Severity</span>
                <p style="font-weight:600;margin-bottom:2px">${inc.type}</p>
                <p style="color:var(--text-secondary);font-size:11px">${inc.desc}</p>`;
            list.appendChild(item);
        });
    } else { panel.style.display = 'none'; }
}

function reverseGeocode(lngLat, elementId) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${lngLat[0]}&lat=${lngLat[1]}`)
        .then(r => r.json()).then(data => {
            if (data && data.display_name) {
                document.getElementById(elementId).value = data.display_name.split(',').slice(0,3).join(',');
            }
        }).catch(err => console.error('Reverse geocoding failed:', err));
}

// ─── CONTROL BUTTONS ─────────────────────────────────────────────────────────
function setupControlButtons() {
    const changeBtn = document.getElementById('btnChangeStart');
    changeBtn.addEventListener('click', () => {
        selectingStart = true;
        changeBtn.innerText   = 'Set Start...';
        changeBtn.className   = 'btn';
    });
}

// ─── GEOCODING ───────────────────────────────────────────────────────────────
async function geocodeDbAddress(address) {
    if (!address || !address.trim()) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address.trim())}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        }
    } catch (e) { console.error('Geocode error:', e); }
    return null;
}

// ─── GEMINI AI PREDICTION ────────────────────────────────────────────────────
async function predictCurrentLocation(startLoc, endLoc, startTime, endTime) {
    const now = new Date().toISOString();
    const prompt = `A vehicle left "${startLoc}" at ${startTime} heading to "${endLoc}", expected at ${endTime}. Now is ${now}. Based on elapsed time fraction of total journey, what single city or town is it nearest to right now? Reply ONLY with the city name. Nothing else.`;
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        );
        const json = await res.json();
        if (json.error) {
            console.error('Gemini error:', json.error.message);
            return null;
        }
        if (json.candidates && json.candidates.length > 0) {
            const raw = json.candidates[0].content.parts[0].text.trim();
            // Take only the first clean token
            return raw.split(/[\n\r,.;]/)[0].trim() || null;
        }
    } catch(e) { console.error('Gemini fetch error:', e); }
    return null;
}

// ─── LOAD DATABASE MARKERS ───────────────────────────────────────────────────
async function loadDatabaseMarkers() {
    if (!supabaseClient) {
        setStatus('❌ Supabase not initialized', '#ef4444');
        return;
    }

    setStatus('🔄 Connecting to database...');

    // Clear old markers
    dbMarkers.forEach(m => { try { if (mapType==='tomtom') m.remove(); else mapInstance.removeLayer(m); } catch(e){} });
    dbMarkers = [];

    // Try all possible table name variants - just need NO error, rows can be 0
    let data = null;
    const tableNames = ['vehicle flow', 'Vehicle Flow', 'Vehicle Registration', 'vehicles'];
    for (const tname of tableNames) {
        const res = await supabaseClient.from(tname).select('*');
        if (!res.error) {
            activeTableName = tname;
            data = res.data || [];
            console.log(`✅ Table found: "${tname}", rows: ${data.length}`);
            break;
        } else {
            console.warn(`Table "${tname}" error: ${res.error.message}`);
        }
    }

    if (data === null) {
        setStatus('❌ Cannot access any table. Check Supabase project URL & key.', '#ef4444');
        setTimeout(() => setStatus(''), 8000);
        return;
    }

    if (data.length === 0) {
        setStatus(`⚠️ Table "${activeTableName}" is empty OR RLS is blocking reads. Go to Supabase → Table → RLS Policies → Add SELECT policy for anon.`, '#f59e0b');
        setTimeout(() => setStatus(''), 10000);
        return;
    }

    setStatus(`📋 Found ${data.length} vehicles. Plotting on map...`);
    let plotted = 0;

    for (const row of data) {
        const rawStatus = (row.status || '').toLowerCase().trim();
        const isAvailable = rawStatus === 'available' || rawStatus === 'avalable';
        const isActive    = rawStatus === 'active';

        if (!isAvailable && !isActive) continue;
        if (assignTasksMode && !isAvailable) continue;

        if (isAvailable) {
            // ── Plot available vehicle at its Current Location ──────────────
            const loc = (
                row['Current Location'] || row['current location'] ||
                row['Start Location']   || row['start location']   ||
                row['Location']         || ''
            ).trim();

            if (!loc) {
                console.warn(`"${row.name}" is available but has no location data in Supabase.`);
                continue;
            }

            setStatus(`📍 Plotting available: ${row.name}...`);
            const coords = await geocodeDbAddress(loc);
            if (coords) {
                addCargoMarker(coords, 'available', '#10b981', row);
                plotted++;
            } else {
                console.warn(`Could not geocode "${loc}" for vehicle ${row.name}`);
            }

        } else if (isActive) {
            // ── For active: AI predicts current location → save → plot ──────
            const startLoc  = (row['Start Location'] || row['start location'] || '').trim();
            const endLoc    = (row['End Location']   || row['end location']   || '').trim();
            const startTime = (row['Start Time']     || row['start time']     || '').trim();
            const endTime   = (row['End Time']       || row['end time']       || '').trim();

            let locationToPlot = startLoc;  // fallback if AI fails
            let markerLabel    = 'active';

            if (startLoc && endLoc && startTime && endTime) {
                setStatus(`🤖 AI predicting location for ${row.name}...`);
                const predicted = await predictCurrentLocation(startLoc, endLoc, startTime, endTime);
                if (predicted) {
                    // Save back to Supabase
                    const { error: upErr } = await supabaseClient
                        .from(activeTableName)
                        .update({ 'Current Location': predicted })
                        .eq('name', row.name);
                    if (!upErr) {
                        locationToPlot = predicted;
                        markerLabel    = 'active (AI)';
                        console.log(`✅ ${row.name} → Current Location updated: "${predicted}"`);
                    } else {
                        console.error('Supabase update failed:', upErr.message);
                    }
                }
            }

            if (locationToPlot) {
                setStatus(`📍 Plotting active vehicle: ${row.name}...`);
                const coords = await geocodeDbAddress(locationToPlot);
                if (coords) {
                    addCargoMarker(coords, markerLabel, '#ef4444', { ...row, 'Current Location': locationToPlot });
                    plotted++;
                }
            }
        }
    }

    if (plotted === 0) {
        setStatus('⚠️ Could not plot any vehicles. Fill location fields in Supabase.', '#f59e0b');
        setTimeout(() => setStatus(''), 8000);
    } else {
        setStatus(`✅ ${plotted} vehicle(s) on map!`, '#10b981');
        setTimeout(() => setStatus(''), 4000);
    }
}

// ─── CARGO MARKER ────────────────────────────────────────────────────────────
function addCargoMarker(coords, label, color, rowData) {
    const html = `
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;">
            <div style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;color:${color};
                background:rgba(15,23,42,0.95);border:1.5px solid ${color};padding:2px 7px;
                border-radius:4px;white-space:nowrap;margin-bottom:2px;
                box-shadow:0 2px 4px rgba(0,0,0,0.5);">${label}</div>
            <div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));">🚛</div>
        </div>`;

    const popup = `
        <div style="color:#f3f4f6;background:#111827;padding:12px;border-radius:8px;
            font-family:Inter,sans-serif;font-size:13px;min-width:210px;">
            <strong style="color:${color};font-size:14px;">${rowData.name || 'Vehicle'}</strong><br>
            <span style="color:#9ca3af;font-size:11px;">${rowData['email id'] || rowData['email ID'] || ''}</span>
            <hr style="border-color:rgba(75,85,99,0.4);margin:8px 0;">
            <p><strong>Role:</strong> ${rowData.role || ''}</p>
            <p><strong>Status:</strong> <span style="color:${color};font-weight:600;">${rowData.status || label}</span></p>
            <p style="font-size:11px;margin-top:6px;color:#9ca3af;">
                <strong>Current Location:</strong> ${rowData['Current Location'] || 'N/A'}
            </p>
        </div>`;

    if (mapType === 'tomtom') {
        const el = document.createElement('div');
        el.innerHTML = html;
        const marker = new tt.Marker({ element: el }).setLngLat([coords[1], coords[0]]).addTo(mapInstance);
        if (assignTasksMode) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', e => { e.stopPropagation(); openAssignModal(rowData); });
        } else {
            marker.setPopup(new tt.Popup({ offset: 30 }).setHTML(popup));
        }
        dbMarkers.push(marker);
    } else {
        const icon = L.divIcon({ html, className:'cargo-marker', iconSize:[65,55], iconAnchor:[32,50] });
        const marker = L.marker(coords, { icon }).addTo(mapInstance);
        if (assignTasksMode) {
            marker.on('click', () => openAssignModal(rowData));
        } else {
            marker.bindPopup(popup);
        }
        dbMarkers.push(marker);
    }
}

// ─── ASSIGN UI ────────────────────────────────────────────────────────────────
function setupAssignUI() {
    const btnRefresh = document.getElementById('btnRefreshMap');
    const btnAssign  = document.getElementById('btnAssignTasks');
    const btnCancel  = document.getElementById('btnCancelTask');
    const btnSubmit  = document.getElementById('btnSubmitTask');
    const modal      = document.getElementById('assignment-modal');

    if (btnRefresh) btnRefresh.addEventListener('click', () => loadDatabaseMarkers());

    if (btnAssign) btnAssign.addEventListener('click', () => {
        assignTasksMode = !assignTasksMode;
        if (assignTasksMode) {
            btnAssign.style.background = '#0ea5e9';
            btnAssign.innerText = 'Exit Assign Mode';
        } else {
            btnAssign.style.background = '#374151';
            btnAssign.innerText = '📋 Assign Tasks';
            if (modal) modal.style.display = 'none';
        }
        loadDatabaseMarkers();
    });

    if (btnCancel) btnCancel.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
        selectedAssignTruck = null;
    });

    if (btnSubmit) btnSubmit.addEventListener('click', async () => {
        if (!selectedAssignTruck) return;
        const startLoc = document.getElementById('assignStart').value.trim();
        const endLoc   = document.getElementById('assignEnd').value.trim();
        if (!startLoc || !endLoc) { alert('Please provide both Start and End locations.'); return; }

        btnSubmit.innerText = 'Assigning...';
        btnSubmit.disabled  = true;

        const now       = new Date();
        const startTime = now.toISOString();
        let   endTime   = new Date(now.getTime() + 2*60*60*1000).toISOString();

        try {
            const sC = await geocodeDbAddress(startLoc);
            const eC = await geocodeDbAddress(endLoc);
            if (sC && eC) {
                const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${sC[1]},${sC[0]};${eC[1]},${eC[0]}`);
                const d = await r.json();
                if (d.routes && d.routes[0]) endTime = new Date(now.getTime() + d.routes[0].duration*1000).toISOString();
            }
        } catch(e) {}

        const { error } = await supabaseClient.from(activeTableName)
            .update({ status:'active', 'Start Location':startLoc, 'End Location':endLoc,
                      'Start Time':startTime, 'End Time':endTime })
            .eq('name', selectedAssignTruck.name);

        btnSubmit.innerText = 'Assign';
        btnSubmit.disabled  = false;

        if (error) {
            alert('Failed to assign task: ' + error.message);
        } else {
            if (modal) modal.style.display = 'none';
            selectedAssignTruck = null;
            document.getElementById('assignStart').value = '';
            document.getElementById('assignEnd').value   = '';
            assignTasksMode = false;
            if (btnAssign) { btnAssign.style.background='#374151'; btnAssign.innerText='📋 Assign Tasks'; }
            loadDatabaseMarkers();
        }
    });
}

function openAssignModal(rowData) {
    selectedAssignTruck = rowData;
    const el = document.getElementById('assign-truck-name');
    if (el) el.innerText = rowData.name || 'Vehicle';
    const modal = document.getElementById('assignment-modal');
    if (modal) modal.style.display = 'block';
}