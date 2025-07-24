const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// in‑memory store
let records = [];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Ingest data ---
// Accepts either a single object or an array of objects
app.post('/api/data', (req, res) => {
  const payload = req.body;
  if (Array.isArray(payload)) {
    records = records.concat(payload);
    return res.json({ message: 'Ingested array of records', count: payload.length });
  } else if (typeof payload === 'object' && payload !== null) {
    records.push(payload);
    return res.json({ message: 'Ingested single record', count: 1 });
  }
  res.status(400).json({ error: 'Invalid format: send an object or array of objects' });
});

// --- Compute & serve KPIs ---
app.get('/api/kpis', (req, res) => {
  const totalRecords = records.length;

  // Example KPI: average of numeric field `processingTime`
  const avgProcTime = totalRecords
    ? records.reduce((sum, r) => sum + (r.processingTime || 0), 0) / totalRecords
    : 0;

  // Example KPI: count per `category`
  const byCategory = records.reduce((acc, r) => {
    const cat = r.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Example KPI: count per day (based on ISO date of `timestamp`)
  const byDate = records.reduce((acc, r) => {
    const day = new Date(r.timestamp || r.date).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalRecords,
    averageProcessingTime: +avgProcTime.toFixed(2),
    recordsByCategory: byCategory,
    recordsByDate: byDate
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KPI Dashboard running at http://localhost:${PORT}`);
});
