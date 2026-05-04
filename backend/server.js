require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/vuelos';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

const routeSchema = new mongoose.Schema({
  origin: String,
  originCode: String,
  destination: String,
  destinationCode: String,
  duration: String
});

const Route = mongoose.model('Route', routeSchema);

const bookingSchema = new mongoose.Schema({
  flightId: String,
  origin: String,
  destination: String,
  date: String,
  airline: String,
  price: Number,
  passenger: {
    name: String,
    email: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'confirmed' 
  },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

const initialRoutes = [
  { origin: 'Ciudad de México', originCode: 'MEX', destination: 'Cancún', destinationCode: 'CUN', duration: '2h 10m' },
  { origin: 'Ciudad de México', originCode: 'MEX', destination: 'Guadalajara', destinationCode: 'GDL', duration: '1h 05m' },
  { origin: 'Ciudad de México', originCode: 'MEX', destination: 'Monterrey', destinationCode: 'MTY', duration: '1h 20m' },
  { origin: 'Ciudad de México', originCode: 'MEX', destination: 'Los Cabos', destinationCode: 'SJD', duration: '2h 30m' },
  { origin: 'Ciudad de México', originCode: 'MEX', destination: 'Puerto Vallarta', destinationCode: 'PVR', duration: '1h 45m' },
  { origin: 'Guadalajara', originCode: 'GDL', destination: 'Cancún', destinationCode: 'CUN', duration: '2h 50m' },
  { origin: 'Guadalajara', originCode: 'GDL', destination: 'Ciudad de México', destinationCode: 'MEX', duration: '1h 05m' },
  { origin: 'Monterrey', originCode: 'MTY', destination: 'Cancún', destinationCode: 'CUN', duration: '2h 40m' },
  { origin: 'Monterrey', originCode: 'MTY', destination: 'Ciudad de México', destinationCode: 'MEX', duration: '1h 20m' },
  { origin: 'Cancún', originCode: 'CUN', destination: 'Ciudad de México', destinationCode: 'MEX', duration: '2h 10m' }
];

async function seedRoutes() {
  try {
    const count = await Route.countDocuments();
    if (count === 0) {
      await Route.insertMany(initialRoutes);
      logger.info('Rutas iniciales sembradas en la DB');
    }
  } catch (err) {
    logger.error(`Error al sembrar rutas: ${err.message}`);
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Conectado a MongoDB');
    await seedRoutes();
  } catch (err) {
    logger.error(`Error conectando a MongoDB: ${err.message}`);
    setTimeout(connectDB, 5000);
  }
};

const AIRLINES = ['Aeroméxico', 'Viva', 'United'];
const FLIGHT_TIMES = ['06:00', '07:30', '09:15', '11:00', '13:45', '15:30', '17:00', '19:20', '21:00'];

function generatePrice(base, date) {
  const demandFactor = Math.random() * 0.4 + 0.8;
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) ? 1.2 : 1.0;
  return Math.round(base * demandFactor * weekendMultiplier);
}

app.get('/api/flights', async (req, res) => {
  const { origin, destination, date } = req.query;
  logger.info(`Búsqueda de vuelos: ${origin || 'cualquier origen'} → ${destination || 'cualquier destino'} | Fecha: ${date || 'cualquier fecha'}`);
  
  let query = {};
  if (origin) {
    query.$or = [
      { origin: new RegExp(origin, 'i') },
      { originCode: origin.toUpperCase() }
    ];
  }
  if (destination) {
    const destQuery = {
      $or: [
        { destination: new RegExp(destination, 'i') },
        { destinationCode: destination.toUpperCase() }
      ]
    };
    if (query.$or) {
      query = { $and: [{ $or: query.$or }, destQuery] };
    } else {
      query = destQuery;
    }
  }

  try {
    const routes = await Route.find(query);
    if (routes.length === 0) {
      return res.json({ flights: [], message: 'No se encontraron vuelos.' });
    }

    const flights = [];
    routes.forEach((route, idx) => {
      const basePrices = [1800, 2400, 3200];
      AIRLINES.forEach((airline, aIdx) => {
        const basePrice = basePrices[aIdx];
        const departureTime = FLIGHT_TIMES[(idx + aIdx * 3) % FLIGHT_TIMES.length];
        const [h, m] = departureTime.split(':').map(Number);
        const arrivalDate = new Date(date || Date.now());
        
        const durationMatch = route.duration.match(/(\d+)h(?:\s+(\d+)m)?/);
        const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
        const minutes = durationMatch && durationMatch[2] ? parseInt(durationMatch[2]) : 0;
        const durationMins = (hours * 60) + minutes;

        arrivalDate.setHours(h);
        arrivalDate.setMinutes(m + durationMins);
        const arrivalTime = `${String(arrivalDate.getHours()).padStart(2,'0')}:${String(arrivalDate.getMinutes()).padStart(2,'0')}`;
        
        flights.push({
          id: `FL${String(idx * 3 + aIdx + 1).padStart(3, '0')}`,
          airline,
          origin: route.origin,
          originCode: route.originCode,
          destination: route.destination,
          destinationCode: route.destinationCode,
          departure: departureTime,
          arrival: arrivalTime,
          duration: route.duration,
          date: date || new Date().toISOString().split('T')[0],
          price: generatePrice(basePrice, date || new Date()),
          seatsAvailable: Math.floor(Math.random() * 40) + 5,
          class: 'Económica'
        });
      });
    });

    flights.sort((a, b) => a.price - b.price);
    res.json({ flights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/book', async (req, res) => {
  const { flightId, origin, destination, date, airline, price, passenger } = req.body;
  if (!flightId || !passenger?.name || !passenger?.email) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }
  try {
    const booking = new Booking({ flightId, origin, destination, date, airline, price, passenger, status: 'confirmed' });
    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(50);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/routes', async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/routes', async (req, res) => {
  try {
    const newRoute = new Route(req.body);
    await newRoute.save();
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

connectDB();

app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT}`);
});