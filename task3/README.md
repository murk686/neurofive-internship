# Task 3 - MongoDB CRUD API

NeuroFive Solutions Backend Internship

## Overview

This project upgrades the Task Manager CRUD API from in-memory storage to MongoDB Atlas using Mongoose.

Data now persists even after the server restarts.

---

## Features

- MongoDB Atlas database
- Mongoose ODM
- User and Task models
- CRUD Operations
- Environment Variables
- Error Handling
- Persistent Storage

---

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- dotenv

---

## Installation

Clone the repository:

```bash
git clone https://github.com/murk686/neurofive-internship.git
```

Go to Task 3:

```bash
cd neurofive-internship/task3
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file inside `task3`.

Example:

```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
```

---

## Run

```bash
npm start
```

or

```bash
npm run dev
```

---

## API Endpoints

### Users

- POST /users
- GET /users

### Tasks

- POST /tasks
- GET /tasks
- GET /tasks/:id
- PUT /tasks/:id
- DELETE /tasks/:id

---

## Database

MongoDB Atlas is used for persistent storage.

Data remains available even after restarting the server.

---

## Author

Murk Channa