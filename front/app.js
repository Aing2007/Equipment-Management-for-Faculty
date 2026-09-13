const apiStatusEl = document.getElementById('apiStatus');
const equipmentListEl = document.getElementById('equipmentList');
const equipmentForm = document.getElementById('equipmentForm');
const refreshBtn = document.getElementById('refreshBtn');

async function getEquipment() {
  try {
    const response = await fetch('/api/equipment');
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load equipment');
    }

    renderEquipment(result.data);
    apiStatusEl.textContent = 'API Connected';
    apiStatusEl.style.color = '#1f9d61';
  } catch (error) {
    apiStatusEl.textContent = 'API Offline';
    apiStatusEl.style.color = '#d97706';
    equipmentListEl.innerHTML = `
      <div class="empty-state">
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderEquipment(items) {
  if (!items.length) {
    equipmentListEl.innerHTML = `
      <div class="empty-state">
        <p>No equipment found.</p>
      </div>
    `;
    return;
  }

  equipmentListEl.innerHTML = items
    .map(
      (item) => `
        <article class="item-card">
          <div class="item-head">
            <h4>${item.name}</h4>
            <span class="badge ${item.status.toLowerCase()}">${item.status}</span>
          </div>
          <div class="meta">
            <span>Location: ${item.location}</span>
            <span>Owner: ${item.owner}</span>
          </div>
        </article>
      `
    )
    .join('');
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const result = await response.json();

    if (response.ok && result.status === 'ok') {
      apiStatusEl.textContent = 'API Connected';
      apiStatusEl.style.color = '#1f9d61';
    }
  } catch (error) {
    apiStatusEl.textContent = 'API Offline';
    apiStatusEl.style.color = '#d97706';
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(equipmentForm);
  const payload = {
    name: formData.get('name'),
    status: formData.get('status'),
    location: formData.get('location'),
    owner: formData.get('owner')
  };

  try {
    const response = await fetch('/api/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to add equipment');
    }

    equipmentForm.reset();
    await getEquipment();
  } catch (error) {
    alert(error.message);
  }
}

refreshBtn.addEventListener('click', getEquipment);
equipmentForm.addEventListener('submit', handleSubmit);

checkHealth();
getEquipment();
