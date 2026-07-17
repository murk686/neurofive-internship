// Manual integration test — run with: node tests/health.test.js
const http = require("http");
const app = require("../src/app");

const server = http.createServer(app);

server.listen(0, () => {
  const port = server.address().port;
  const url = `http://localhost:${port}/health`;

  http.get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const body = JSON.parse(data);
      const passed = res.statusCode === 200 && body.status === "ok";

      console.log(`\n✅ GET /health → ${res.statusCode}`);
      console.log("Response:", JSON.stringify(body, null, 2));
      console.log(passed ? "\n🟢 TEST PASSED" : "\n🔴 TEST FAILED");

      server.close();
      process.exit(passed ? 0 : 1);
    });
  });
});
