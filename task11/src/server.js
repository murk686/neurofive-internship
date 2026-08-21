require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ NeuroFive API running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs at http://localhost:${PORT}/api-docs`);
});
