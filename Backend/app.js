require('dotenv').config();
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and set JWT_SECRET.');
  process.exit(1);
}
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ message: 'NoSQL Social Network API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/nosql_social_db');

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));