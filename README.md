# 🍴 NutriBharat: Indian Food Nutrition Estimator

NutriBharat is a premium full-stack web application designed to help users track their nutrition with a focus on Indian cuisine. Using AI-powered image recognition (and a smart local fallback), it identifies dishes from photos and provides detailed macro-nutrient breakdowns.

![NutriBharat Banner](https://images.unsplash.com/photo-1585932231552-05b072223c65?auto=format&fit=crop&q=80&w=1200&h=400)

## ✨ Features

- **📷 AI Food Recognition**: Upload photos of your meals to automatically detect dishes.
- **🔍 Smart Search**: Comprehensive catalog of 80+ Indian foods with fuzzy search and category filters.
- **📋 Meal Tracker**: Log your Breakfast, Lunch, Dinner, and Snacks with a daily nutrition timeline.
- **📊 Dynamic Dashboard**: Visualize your progress with interactive Calorie Trends, Macro Donut Charts, and Meal Distribution.
- **🌓 Dark Mode**: Premium UI support for both light and dark aesthetics.
- **📶 Intelligent Offline Fallback**: Works perfectly even with restricted network settings by using keyword-based detection.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), JavaScript (ES6+)
- **Backend**: Python 3.10+, Flask
- **Database**: MongoDB (Atlas/Cloud support)
- **Analytics**: Pandas (Data Processing), Chart.js (Visualizations)
- **Vision AI**: Google Vision API & Hugging Face (supports Offline Mode)

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- A MongoDB Cluster (Local or [Atlas](https://www.mongodb.com/cloud/atlas))

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nutri-bharat.git
cd nutri-bharat

# Install dependencies
py -m pip install -r requirements.txt
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
SECRET_KEY=your_secret_key
MONGO_URI=mongodb+srv://your_user:your_pass@cluster...
VISION_PROVIDER=google
GOOGLE_VISION_API_KEY=your_google_key
```

### 4. Seed the Database
Populate the search catalog with Indian food data:

```bash
py scripts/seed_db.py
```

### 5. Run Locally
```bash
py run.py
```
Visit `http://localhost:5000` in your browser.

## 📦 Deployment

This project is configured for easy deployment on **Render** or **Railway.app**.

1.  Push your code to GitHub.
2.  Connect your repository to Render.
3.  Set the start command to: `gunicorn run:app`
4.  Add your `.env` variables in the platform dashboard.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for Indian Food Lovers.
