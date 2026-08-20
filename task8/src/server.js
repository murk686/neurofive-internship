require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ NeuroFive API running on http://localhost:${PORT}`);
  console.log(`👤 Seeded: admin@test.com | mod@test.com | user@test.com (all pw: secret123)`);
  console.log(`🔐 Roles: admin > moderator > user`);
});
