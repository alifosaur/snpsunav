// Campus locations
const DESTINATIONS = {
  'a-block': { lat: 13.0932, lng: 77.5255, name: 'A Block Main Dome Building', floor: 0 },
  'b-block': { lat: 13.0930, lng: 77.5258, name: 'B Block', floor: 0 },
  'c-block': { lat: 13.0935, lng: 77.5252, name: 'C Block', floor: 0 },
  'library': { lat: 13.0935, lng: 77.5252, name: 'Library', floor: 2 },
  'cafeteria': { lat: 13.0929, lng: 77.5251, name: 'Cafeteria', floor: 0 },
  'auditorium': { lat: 13.0933, lng: 77.5254, name: 'Auditorium', floor: 0 }
};

// Voice recognition
let recognition = null;
let isListening = false;

// Speech synthesis
let synthesis = window.speechSynthesis;
let currentUtterance = null;

// Navigation state
let userLocation = null;
let watchId = null;
let currentDestination = null;
let navigationActive = false;
let lastInstruction = '';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initVoiceRecognition();
  setupEventListeners();
  announceWelcome();
});

// Announce welcome message
function announceWelcome() {
  setTimeout(() => {
    speak('Welcome to Sapthagiri N P S University accessible navigation. Tap the microphone button and speak your destination, or use the quick access buttons below. For example, say, take me to A Block, or navigate to library.');
  }, 1000);
}

// Initialize voice recognition
function initVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    speak('Sorry, voice recognition is not supported in your browser. Please use the quick access buttons instead.');
    document.getElementById('voice-command-btn').disabled = true;
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN'; // Indian English
  
  recognition.onstart = function() {
    isListening = true;
    const btn = document.getElementById('voice-command-btn');
    btn.classList.add('listening');
    document.querySelector('.voice-text').textContent = 'Listening...';
    updateFeedback('👂 Listening...', 'I am listening. Please speak your destination now.');
  };
  
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log('Heard:', transcript);
    handleVoiceCommand(transcript);
  };
  
  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    const btn = document.getElementById('voice-command-btn');
    btn.classList.remove('listening');
    document.querySelector('.voice-text').textContent = 'Tap to Speak';
    
    if (event.error === 'no-speech') {
      speak('I did not hear anything. Please try again.');
      updateFeedback('❌ No speech detected', 'I did not hear you. Please tap the button and speak clearly.');
    } else {
      speak('There was an error. Please try again.');
      updateFeedback('❌ Error', 'Something went wrong. Please try again.');
    }
  };
  
  recognition.onend = function() {
    isListening = false;
    const btn = document.getElementById('voice-command-btn');
    btn.classList.remove('listening');
    document.querySelector('.voice-text').textContent = 'Tap to Speak';
  };
}

// Setup event listeners
function setupEventListeners() {
  // Voice command button
  document.getElementById('voice-command-btn').addEventListener('click', startListening);
  
  // Quick destination buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const destination = this.dataset.destination;
      handleDestinationSelection(destination);
    });
  });
  
  // Control buttons
  document.getElementById('repeat-btn').addEventListener('click', repeatInstruction);
  document.getElementById('stop-nav-btn').addEventListener('click', stopNavigation);
  document.getElementById('emergency-btn').addEventListener('click', emergencyHelp);
}

// Start listening for voice command
function startListening() {
  if (!recognition) {
    speak('Voice recognition is not available');
    return;
  }
  
  if (isListening) {
    recognition.stop();
    return;
  }
  
  try {
    recognition.start();
  } catch (e) {
    console.error('Failed to start recognition:', e);
  }
}

// Handle voice command
function handleVoiceCommand(transcript) {
  console.log('Processing command:', transcript);
  updateFeedback('🎯 Processing...', `You said: ${transcript}`);
  
  // Check for each destination
  let foundDestination = null;
  
  for (const [key, dest] of Object.entries(DESTINATIONS)) {
    const keywords = dest.name.toLowerCase().split(' ');
    const hasMatch = keywords.some(keyword => transcript.includes(keyword));
    
    if (hasMatch || transcript.includes(key.replace('-', ' '))) {
      foundDestination = key;
      break;
    }
  }
  
  if (foundDestination) {
    speak(`Understood. Navigating to ${DESTINATIONS[foundDestination].name}`);
    handleDestinationSelection(foundDestination);
  } else {
    speak('Sorry, I did not understand the destination. Please say the name clearly, such as A Block, B Block, C Block, Library, Cafeteria, or Auditorium. You can also use the quick access buttons.');
    updateFeedback('❓ Not understood', 'I could not recognize the destination. Please try again or use the quick access buttons.');
  }
}

// Handle destination selection
function handleDestinationSelection(destinationKey) {
  const destination = DESTINATIONS[destinationKey];
  
  if (!destination) return;
  
  currentDestination = {
    key: destinationKey,
    ...destination
  };
  
  speak(`Starting navigation to ${destination.name}. Getting your current location.`);
  updateFeedback('📍 Getting location...', `Preparing route to ${destination.name}`);
  
  // Get user location
  getUserLocation();
}

// Get user location
function getUserLocation() {
  if (!navigator.geolocation) {
    speak('Location services are not available on your device');
    updateFeedback('❌ Error', 'Location services not available');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    function(position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log('Location acquired:', userLocation);
      speak('Location acquired. Starting navigation now.');
      
      // Start navigation
      startNavigation();
    },
    function(error) {
      console.error('Location error:', error);
      speak('Unable to get your location. Please make sure location services are enabled and try again.');
      updateFeedback('❌ Location error', 'Could not get your location. Please check settings.');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Start navigation
function startNavigation() {
  if (!userLocation || !currentDestination) return;
  
  // Show navigation status card
  document.getElementById('navigation-status').style.display = 'block';
  document.getElementById('current-destination').textContent = currentDestination.name;
  
  // Scroll to navigation
  setTimeout(() => {
    document.getElementById('navigation-status').scrollIntoView({ behavior: 'smooth' });
  }, 300);
  
  // Calculate initial distance
  const distance = getDistance(
    userLocation.lat, userLocation.lng,
    currentDestination.lat, currentDestination.lng
  );
  
  const distanceM = Math.round(distance);
  const timeMin = Math.ceil(distance / 80);
  
  // Generate and announce first instruction
  const firstInstruction = `Head towards ${currentDestination.name}. The destination is ${distanceM} meters ahead. Estimated walking time is ${timeMin} minutes. I will guide you with turn by turn directions.`;
  
  updateInstruction('🎯', firstInstruction);
  speak(firstInstruction);
  lastInstruction = firstInstruction;
  
  // Update distance display
  document.getElementById('live-distance').textContent = distanceM;
  
  // Start live tracking
  startLiveTracking();
  
  navigationActive = true;
}

// Start live tracking
function startLiveTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
  
  console.log('Starting live tracking...');
  
  let lastAnnouncedDistance = null;
  
  watchId = navigator.geolocation.watchPosition(
    function(position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Calculate remaining distance
      const remaining = getDistance(
        userLocation.lat, userLocation.lng,
        currentDestination.lat, currentDestination.lng
      );
      
      const distanceM = Math.round(remaining);
      
      // Update display
      document.getElementById('live-distance').textContent = distanceM;
      
      // Announce distance updates at intervals
      if (!lastAnnouncedDistance || Math.abs(lastAnnouncedDistance - distanceM) >= 50) {
        const instruction = generateInstruction(distanceM);
        updateInstruction('🧭', instruction);
        speak(instruction);
        lastInstruction = instruction;
        lastAnnouncedDistance = distanceM;
      }
      
      // Check if arrived
      if (remaining < 15) {
        speak(`You have arrived at ${currentDestination.name}. Navigation complete.`);
        updateInstruction('🎯', `You have arrived at ${currentDestination.name}!`);
        setTimeout(stopNavigation, 3000);
      }
      
      console.log('Distance:', distanceM + 'm');
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

// Generate instruction based on distance
function generateInstruction(distance) {
  if (distance > 200) {
    return `Continue straight ahead. ${distance} meters to ${currentDestination.name}.`;
  } else if (distance > 100) {
    return `You are getting close. ${distance} meters remaining. Continue straight.`;
  } else if (distance > 50) {
    return `Almost there. ${distance} meters ahead. The building should be visible now.`;
  } else if (distance > 20) {
    return `Very close. ${distance} meters remaining. Look for the entrance of ${currentDestination.name}.`;
  } else {
    return `You are almost at the destination. ${distance} meters away.`;
  }
}

// Update instruction display
function updateInstruction(icon, text) {
  document.getElementById('instruction-icon').textContent = icon;
  document.getElementById('current-instruction').textContent = text;
}

// Repeat last instruction
function repeatInstruction() {
  if (lastInstruction) {
    speak(lastInstruction);
  } else {
    speak('No instruction to repeat');
  }
}

// Stop navigation
function stopNavigation() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  synthesis.cancel();
  navigationActive = false;
  currentDestination = null;
  lastInstruction = '';
  
  speak('Navigation stopped. You can start a new route anytime.');
  
  // Hide navigation status
  setTimeout(() => {
    document.getElementById('navigation-status').style.display = 'none';
    updateFeedback('✅ Ready', 'Waiting for your command...');
  }, 2000);
}

// Emergency help
function emergencyHelp() {
  synthesis.cancel();
  
  const message = 'Emergency help activated. Calling for assistance. Your location has been shared. Help is on the way. Please stay where you are.';
  
  speak(message);
  updateFeedback('🚨 EMERGENCY', message);
  
  alert('🚨 Emergency mode activated!\n\nIn a real scenario, this would:\n- Alert campus security\n- Share your GPS location\n- Call emergency contact\n\nDemo mode: Navigation continues normally.');
}

// Update feedback display
function updateFeedback(icon, text) {
  document.querySelector('.status-icon').textContent = icon;
  document.getElementById('feedback-text').textContent = text;
}

// Speak text
function speak(text) {
  // Cancel any ongoing speech
  synthesis.cancel();
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.85; // Slower for clarity
  currentUtterance.pitch = 1;
  currentUtterance.volume = 1;
  currentUtterance.lang = 'en-IN';
  
  // Use best available voice
  const voices = synthesis.getVoices();
  const indianVoice = voices.find(v => v.lang.includes('en-IN')) || 
                      voices.find(v => v.lang.includes('en-'));
  if (indianVoice) {
    currentUtterance.voice = indianVoice;
  }
  
  synthesis.speak(currentUtterance);
  console.log('🔊 Speaking:', text);
}

// Calculate distance (Haversine)
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
