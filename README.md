# 🏄 Fictional PERN App for a Flowrider with Integrated Shop and Booking System

Final project for the **Full-Stack Engineer** course on Codecademy.  
This is a fictional website for a flowhouse located in Copenhagen.

---

## 🏗️ Architecture

This project uses a **PERN stack** (PostgreSQL, Express, React, Node.js).

- **Frontend (React)** follows the **MVVM (Model–View–ViewModel)** pattern:
  - **Model:** data fetched from the API and managed in state
  - **ViewModel:** React component logic, hooks, and context/state management
  - **View:** JSX templates rendered to the DOM

- **Backend (Express/Node)** follows a **classic MVC (Model–View–Controller)** structure:
  - **Model:** database models and queries (PostgreSQL)
  - **Controller:** Express route handlers
  - **View:** handled by the frontend (React) — backend returns JSON only

The frontend and backend communicate via a **REST API**.

---

## 🌊 Project Description

A **flowhouse** is a venue with a surf simulator (Flowrider), where guests can surf, chill, and enjoy drinks and food.  
This demo website integrates:
- 🏄 A **booking system** for flow sessions  
- ☕ A **café menu**  
- 🛍️ A **shop** for products like flowboards and boardshorts
- 💡 An **about** page

---

## ✨ Features

- Full-stack PERN implementation
- Shop page rendering products from a PostgreSQL database
- Booking system for flowrider sessions
- REST API for communication between frontend and backend
- Already built React frontend (ready for deployment)

---

## 🛒 Uploading Products to the Shop

To add products to the shop:
1. Insert product name, description, price, and image URL into the database.
2. The shop component will automatically render the new product.

---

## 🧰 Installation

1. Clone the repository:
        ```bash
        git clone https://github.com/Aslak2322/Socialcademy.git```
2. Install dependencies:
        npm install
3. Start the server and client:
        node server.js


### Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

