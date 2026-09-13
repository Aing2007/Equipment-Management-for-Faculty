const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const frontDir = path.join(__dirname, '..', 'front');

const equipment = [
  { id: 1, name: 'Projector', status: 'Available', location: 'Room 101', owner: 'CS Faculty' },
  { id: 2, name: 'Laptop', status: 'Borrowed', location: 'Lab 2', owner: 'Math Faculty' },
  { id: 3, name: 'Camera', status: 'Available', location: 'Media Room', owner: 'Arts Faculty' }
];

app.use(express.json());
app.use(express.static(frontDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Equipment Management API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/equipment', (req, res) => {
  res.json({
    success: true,
    data: equipment
  });
});

app.get('/api/equipment/:id', (req, res) => {
  const item = equipment.find((entry) => entry.id === Number(req.params.id));

  if (!item) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }

  res.json({ success: true, data: item });
});

app.post('/api/equipment', (req, res) => {
  const { name, status, location, owner } = req.body || {};

  if (!name || !status || !location || !owner) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, status, location, and owner'
    });
  }

  const newItem = {
    id: equipment.length ? equipment[equipment.length - 1].id + 1 : 1,
    name,
    status,
    location,
    owner
  };

  equipment.push(newItem);

  res.status(201).json({
    success: true,
    data: newItem
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
