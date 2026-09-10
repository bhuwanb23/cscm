// WebSocket connection
const ws = new WebSocket(`ws://${window.location.host}`);

// Service status elements
const serviceElements = {
  backend: {
    indicator: document.getElementById('backend-status'),
    statusText: document.getElementById('backend-status-text'),
    responseTime: document.getElementById('backend-response-time'),
    lastCheck: document.getElementById('backend-last-check')
  },
  gateway: {
    indicator: document.getElementById('gateway-status'),
    statusText: document.getElementById('gateway-status-text'),
    responseTime: document.getElementById('gateway-response-time'),
    lastCheck: document.getElementById('gateway-last-check')
  },
  aiMl: {
    indicator: document.getElementById('aiMl-status'),
    statusText: document.getElementById('aiMl-status-text'),
    responseTime: document.getElementById('aiMl-response-time'),
    lastCheck: document.getElementById('aiMl-last-check')
  }
};

// Update service status in UI
function updateServiceStatus(service, status) {
  const elements = serviceElements[service];
  if (!elements) return;

  // Update status indicator
  elements.indicator.className = 'status-indicator ' + status.status;

  // Update status text
  elements.statusText.textContent = status.status.charAt(0).toUpperCase() + status.status.slice(1);

  // Update response time
  if (status.responseTime) {
    elements.responseTime.textContent = status.responseTime + 'ms';
  } else {
    elements.responseTime.textContent = '-';
  }

  // Update last check time
  if (status.lastCheck) {
    const date = new Date(status.lastCheck);
    elements.lastCheck.textContent = date.toLocaleTimeString();
  } else {
    elements.lastCheck.textContent = '-';
  }
}

// Handle WebSocket messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'status') {
    Object.keys(data.data).forEach(service => {
      updateServiceStatus(service, data.data[service]);
    });

    // Update last updated time
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  }
};

// Handle WebSocket connection
ws.onopen = () => {
  console.log('Connected to dashboard WebSocket');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from dashboard WebSocket');
  // Attempt to reconnect after 5 seconds
  setTimeout(() => {
    window.location.reload();
  }, 5000);
};

// Restart service
function restartService(service) {
  if (confirm(`Are you sure you want to restart ${service}?`)) {
    ws.send(JSON.stringify({ type: 'restart', service }));
  }
}

// View logs
function viewLogs(service) {
  // In a real implementation, this would open a logs viewer
  alert(`Logs viewer for ${service} is not yet implemented. Use 'docker compose logs -f ${service}' instead.`);
}

// Fetch initial status
fetch('/api/status')
  .then(response => response.json())
  .then(data => {
    Object.keys(data).forEach(service => {
      updateServiceStatus(service, data[service]);
    });
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  })
  .catch(error => {
    console.error('Error fetching initial status:', error);
  });
