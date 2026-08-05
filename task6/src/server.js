require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ NeuroFive API running on http://localhost:${PORT}`);
  console.log(`📦 Seeded: 40 posts, 40 comments across 3 users`);
});
