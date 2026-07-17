const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Task Manager API running on port ${PORT}`);
  console.log(`📋 Tasks endpoint: http://localhost:${PORT}/tasks`);
  console.log(`🩺 Health check:   http://localhost:${PORT}/health`);
});
