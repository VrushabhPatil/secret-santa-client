---

# 📘 FULL README — Frontend  
**Repository:** `secret-santa-client`

---

```md
# 🎅 Secret Santa Assignment – Frontend

A React (Vite) frontend application that allows users to upload employee CSV files and generate Secret Santa assignments via backend API integration.

---

## 🌍 Live Demo

Frontend: https://your-vercel-url.vercel.app  
Backend: https://your-render-url.onrender.com  

---

## 📌 Overview

This frontend application provides a clean interface to:

- Upload employee CSV file
- Upload previous-year CSV file (optional)
- Generate Secret Santa assignments
- Download the generated CSV file

The application communicates with a deployed Node.js backend service.

---

## 🚀 Tech Stack

- React (Vite)
- JavaScript
- Axios
- HTML5 / CSS

---

## ✨ Features

- CSV file upload
- Optional previous-year input
- API integration using Axios
- File download support
- Error handling
- Environment-based API configuration

---

## 🏗 Project Structure

src/
├── App.jsx
├── main.jsx


Minimal and clean structure focused on functionality.

---

## 🔗 API Integration

The frontend communicates with the backend:

POST /api/santa


Uses Axios with FormData to upload files.

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

For local development:

VITE_API_URL=http://localhost:5000


For production:

VITE_API_URL=https://your-render-url.onrender.com


In App.jsx:

```javascript
axios.post(
  `${import.meta.env.VITE_API_URL}/api/santa`,
  formData,
  { responseType: "blob" }
);
⚙️ Local Setup
git clone https://github.com/yourusername/secret-santa-client.git
cd secret-santa-client
npm install
npm run dev
Runs at:

http://localhost:5173
🚀 Deployment
Deployed using Vercel.

Automatic build from GitHub repository.

👨‍💻 Author
Vrushabh Patil
