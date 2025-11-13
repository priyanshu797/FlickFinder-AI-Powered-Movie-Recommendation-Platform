# 🎬 CineAI – AI Movie Recommendation System

A simple and clean AI-powered movie recommendation web app built using **React (Frontend)**, **Flask (Backend)**, **Groq Llama-3.3 AI**, **SQLite**, and **Docker**.

---

## 📌 Description

CineAI recommends movies based on genres, years, and custom text preferences.
Backend uses **Groq AI** to generate smart movie recommendations and stores user history in a **SQLite database**.
Frontend provides a fast, responsive UI with category filters and history view.

---

## 🛠️ Tech Stack

### **Frontend**

* React.js
* Lucide Icons
* CSS (Custom inline styling)

### **Backend**

* Flask (Python)
* SQLite Database
* Groq Llama-3.3 70B Model
* Flask-CORS
* SQLAlchemy ORM

### **Deployment / Tools**

* Docker
* Node.js / NPM
* Python 3.10+

---

## 📂 Folder Structure

```
CineAI/
│── backend/
│   ├── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── movies.db (auto created)
│
│── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── App.js
│
│── README.md
│── .gitignore
```

---

# 🚀 How to Run the Project

## ▶️ 1. Run Backend (Flask) – Without Docker

```
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on: **[http://localhost:5000](http://localhost:5000)**

---

## ▶️ 2. Run Frontend (React)

```
cd frontend
npm install
npm start
```

Frontend runs on: **[http://localhost:3000](http://localhost:3000)**

---

# 🐳 Running Backend with Docker

Make sure you are inside the **backend folder**.

### ✔ Build Docker Image

```
docker build -t cineai-backend .
```

### ✔ Run Container

```
docker run -p 5000:5000 cineai-backend
```

Backend now runs at:

```
http://localhost:5000
```

---

# 📌 Summary

| Section            | Status  |
| ------------------ | ------- |
| Name & Description | ✅ Added |
| Tech Stack         | ✅ Added |
| Folder Structure   | ✅ Added |
| Commands           | ✅ Added |
| Docker Support     | ✅ Added |

Let me know if you want a shorter or more professional version!

# 📜**License**

MIT License © 2025 CineAI
