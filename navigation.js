// Real GPS Coordinates - Sapthagiri NPS University
const CAMPUS_LOCATIONS = {
  'a': { lat: 13.0932, lng: 77.5255, name: 'A Block (Main Dome)' },
  'b': { lat: 13.0930, lng: 77.5258, name: 'B Block' },
  'c': { lat: 13.0935, lng: 77.5252, name: 'C Block' }
};

// Floor structure
const FLOOR_ROOMS = {
  classrooms: 9,
  labs: 2,
  staffRooms: 2,
  teacherRooms: 2,
  washrooms: 2,
  lifts: 6
};

let userLocation = null;
let watchId = null;
let currentDestination = null;
let navigationActive = false;
let currentInstructionIndex = 0;
let allInstructions = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  document.getElementById('get-location-btn').addEventListener('click', getUserLocation);
  document.getElementById('block-select').addEventListener('change', handleBlockSelection);
  document.getElementById('floor-select').addEventListener('change', handleFloorSelection);
  document.getElementById('room-select').addEventListener('change', handleRoomSelection);
  document.getElementById('navigate-btn').addEventListener('click', startNavigation);
  document.getElementById('stop-nav-btn').addEventListener('click', stopNavigation);
}

// Get user location
function getUserLocation() {
  const btn = document.getElementById('get-location-btn');

  if (!navigator.geolocation) {
    showStatus('❌ Geolocation not supported by your browser', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span><span>Getting Location...</span>';
  showStatus('📍 Getting your GPS location...', 'success');

  navigator.geolocation.getCurrentPosition(
    function(position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      btn.innerHTML = '<span class="btn-icon">✅</span><span>Location Acquired</span>';
      showStatus(`✅ Location acquired successfully`, 'success');
    },
    function(error) {
      let errorMsg = '❌ Unable to get location. ';
      if (error.code === 1) errorMsg += 'Please allow location access.';
      else if (error.code === 2) errorMsg += 'Location unavailable.';
      else errorMsg += 'Request timeout.';

      showStatus(errorMsg, 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🎯</span><span>Try Again</span>';
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('location-status');
  status.textContent = message;
  status.className = 'status-message show ' + type;
}

// Handle block selection
function handleBlockSelection() {
  const block = document.getElementById('block-select').value;

  if (!block) {
    document.getElementById('floor-selector').style.display = 'none';
    document.getElementById('room-selector').style.display = 'none';
    document.getElementById('navigate-btn').style.display = 'none';
    document.getElementById('campus-map-card').style.display = 'none';
    return;
  }

  const campusMapCard = document.getElementById('campus-map-card');
  campusMapCard.style.display = 'block';

  const marker = document.getElementById('block-marker');
  marker.style.display = 'block';

  if (block === 'a') {
    marker.style.left = '45%';
    marker.style.top = '40%';
  } else if (block === 'b') {
    marker.style.left = '20%';
    marker.style.top = '50%';
  } else if (block === 'c') {
    marker.style.left = '70%';
    marker.style.top = '35%';
  }

  document.getElementById('floor-selector').style.display = 'block';
  document.getElementById('room-selector').style.display = 'none';
  document.getElementById('navigate-btn').style.display = 'none';
}

// Handle floor selection
function handleFloorSelection() {
  const block = document.getElementById('block-select').value;
  const floor = document.getElementById('floor-select').value;

  if (!block || floor === '') return;

  generateRoomList(block, floor);

  const floorMapCard = document.getElementById('floor-map-card');
  floorMapCard.style.display = 'block';

  const floorTitle = document.getElementById('floor-title');
  floorTitle.textContent = `${CAMPUS_LOCATIONS[block].name} - Floor ${floor}`;

  document.getElementById('room-selector').style.display = 'block';
}

// Generate room list
function generateRoomList(block, floor) {
  const roomSelect = document.getElementById('room-select');
  roomSelect.innerHTML = '<option value="">-- Choose Room --</option>';

  const floorCode = block.toUpperCase() + (floor < 10 ? '0' + floor : floor);

  for (let i = 1; i <= FLOOR_ROOMS.classrooms; i++) {
    const option = document.createElement('option');
    option.value = `${floorCode}-CR${i}`;
    option.textContent = `Classroom ${floorCode}-CR${i}`;
    roomSelect.appendChild(option);
  }

  for (let i = 1; i <= FLOOR_ROOMS.labs; i++) {
    const option = document.createElement('option');
    option.value = `${floorCode}-LAB${i}`;
    option.textContent = `Computer Lab ${floorCode}-LAB${i}`;
    roomSelect.appendChild(option);
  }

  for (let i = 1; i <= FLOOR_ROOMS.staffRooms; i++) {
    const option = document.createElement('option');
    option.value = `${floorCode}-SR${i}`;
    option.textContent = `Staff Room ${floorCode}-SR${i}`;
    roomSelect.appendChild(option);
  }

  for (let i = 1; i <= FLOOR_ROOMS.teacherRooms; i++) {
    const option = document.createElement('option');
    option.value = `${floorCode}-TR${i}`;
    option.textContent = `Teacher Room ${floorCode}-TR${i}`;
    roomSelect.appendChild(option);
  }

  for (let i = 1; i <= FLOOR_ROOMS.lifts; i++) {
    const option = document.createElement('option');
    option.value = `${floorCode}-LIFT${i}`;
    option.textContent = `🛗 Lift ${i}`;
    roomSelect.appendChild(option);
  }
}

// Handle room selection
function handleRoomSelection() {
  const room = document.getElementById('room-select').value;

  if (!room) {
    document.getElementById('navigate-btn').style.display = 'none';
    return;
  }

  const roomMarker = document.getElementById('room-marker');
  roomMarker.style.display = 'block';
  roomMarker.style.left = (Math.random() * 70 + 15) + '%';
  roomMarker.style.top = (Math.random() * 70 + 15) + '%';

  document.getElementById('navigate-btn').style.display = 'block';
}

// Start navigation
function startNavigation() {
  const block = document.getElementById('block-select').value;
  const floor = document.getElementById('floor-select').value;
  const room = document.getElementById('room-select').value;

  if (!userLocation) {
    alert('⚠️ Please get your location first!');
    return;
  }

  if (!block || !room) {
    alert('⚠️ Please select block, floor, and room!');
    return;
  }

  currentDestination = {
    block: block,
    floor: floor,
    room: room,
    coords: CAMPUS_LOCATIONS[block],
    name: `${room} in ${CAMPUS_LOCATIONS[block].name}`
  };

  document.getElementById('navigation-card').style.display = 'block';

  setTimeout(() => {
    document.getElementById('navigation-card').scrollIntoView({ behavior: 'smooth' });
  }, 300);

  generateTurnByTurnInstructions();
  startLiveTracking();

  navigationActive = true;
}

// Generate turn-by-turn instructions
function generateTurnByTurnInstructions() {
  const destination = currentDestination;
  const distance = getDistance(
    userLocation.lat, userLocation.lng,
    destination.coords.lat, destination.coords.lng
  );

  const distanceM = Math.round(distance);
  const timeMin = Math.ceil(distance / 80);

  document.getElementById('live-distance').textContent = distanceM;
  document.getElementById('live-time').textContent = timeMin + ' min';

  allInstructions = generateRealisticInstructions(distanceM, destination);
  currentInstructionIndex = 0;

  const firstInst = allInstructions[0];
  document.getElementById('current-icon').textContent = firstInst.icon;
  document.getElementById('current-instruction-text').textContent = firstInst.text;
  document.getElementById('current-distance').textContent = firstInst.distance;

  const turnSteps = document.getElementById('turn-steps');
  turnSteps.innerHTML = '';

  allInstructions.forEach(inst => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'turn-step';
    stepDiv.innerHTML = `
      <div class="turn-step-icon">${inst.icon}</div>
      <div class="turn-step-content">
        <div class="turn-step-text">${inst.text}</div>
        <div class="turn-step-distance">${inst.distance}</div>
      </div>
    `;
    turnSteps.appendChild(stepDiv);
  });
}

// Generate realistic turn instructions
function generateRealisticInstructions(totalDistance, destination) {
  const instructions = [];
  let remaining = totalDistance;

  instructions.push({
    icon: '🎯',
    text: 'Head towards ' + destination.coords.name,
    distance: `${totalDistance}m total`,
    threshold: totalDistance
  });

  if (remaining > 200) {
    instructions.push({
      icon: '⬆️',
      text: 'Continue straight on main path',
      distance: `In ${Math.round(remaining * 0.3)}m`,
      threshold: Math.round(remaining * 0.7)
    });

    instructions.push({
      icon: '↗️',
      text: 'Turn slight right towards ' + destination.block.toUpperCase() + ' Block',
      distance: `In ${Math.round(remaining * 0.5)}m`,
      threshold: Math.round(remaining * 0.5)
    });

    instructions.push({
      icon: '➡️',
      text: 'Turn right at the entrance',
      distance: `In ${Math.round(remaining * 0.7)}m`,
      threshold: Math.round(remaining * 0.3)
    });
  }

  instructions.push({
    icon: '🏢',
    text: 'Enter ' + destination.coords.name,
    distance: `In ${Math.round(remaining * 0.85)}m`,
    threshold: Math.round(remaining * 0.15)
  });

  if (destination.floor > 0) {
    instructions.push({
      icon: '🛗',
      text: `Take lift to Floor ${destination.floor}`,
      distance: 'Inside building',
      threshold: 50
    });

    instructions.push({
      icon: '↗️',
      text: `Exit lift and turn right`,
      distance: `Floor ${destination.floor}`,
      threshold: 30
    });

    instructions.push({
      icon: '🚪',
      text: `${destination.room} will be on your left`,
      distance: 'In corridor',
      threshold: 15
    });
  }

  instructions.push({
    icon: '🎯',
    text: 'You have arrived at ' + destination.room,
    distance: 'Destination reached',
    threshold: 0
  });

  return instructions;
}

// Start live tracking
function startLiveTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }

  watchId = navigator.geolocation.watchPosition(
    function(position) {
      const newPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      userLocation = newPos;

      const remaining = getDistance(
        newPos.lat, newPos.lng,
        currentDestination.coords.lat, currentDestination.coords.lng
      );

      const distanceM = Math.round(remaining);
      const timeMin = Math.ceil(remaining / 80);

      document.getElementById('live-distance').textContent = distanceM;
      document.getElementById('live-time').textContent = timeMin + ' min';
      document.getElementById('current-distance').textContent = `${distanceM}m remaining`;

      if (currentInstructionIndex < allInstructions.length - 1) {
        const nextInst = allInstructions[currentInstructionIndex + 1];
        if (remaining <= nextInst.threshold) {
          currentInstructionIndex++;

          document.getElementById('current-icon').textContent = nextInst.icon;
          document.getElementById('current-instruction-text').textContent = nextInst.text;
          document.getElementById('current-distance').textContent = nextInst.distance;
        }
      }

      if (remaining < 20) {
        alert('🎯 You have arrived at ' + currentDestination.room + '!');
        stopNavigation();
      }
    },
    function(error) {
      console.error('Tracking error:', error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}

// Stop navigation
function stopNavigation() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  navigationActive = false;
  currentDestination = null;

  setTimeout(() => {
    document.getElementById('block-select').value = '';
    document.getElementById('floor-selector').style.display = 'none';
    document.getElementById('room-selector').style.display = 'none';
    document.getElementById('navigate-btn').style.display = 'none';
    document.getElementById('campus-map-card').style.display = 'none';
    document.getElementById('floor-map-card').style.display = 'none';
    document.getElementById('navigation-card').style.display = 'none';
  }, 2000);
}

// Calculate distance (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
