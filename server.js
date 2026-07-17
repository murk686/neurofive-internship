const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`🚀 Task Manager API running on port ${PORT}`);
  console.log(`📋 Tasks endpoint: http://localhost:${PORT}/tasks`);
  console.log(`🩺 Health check:   http://localhost:${PORT}/health`);
=======
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574
});
