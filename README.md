# SOLO CARD LLC - Mobile App

A modern, location-aware financial recommendation tool designed to help users find the best credit card rewards for their specific spending location and categories.

## 📱 About the App

**SOLO CARD LLC** combines real-time geolocation with advanced rewards analysis to recommend the optimal credit card for any shopping destination. Whether you're at a local diner, pharmacy, or hotel, the app instantly analyzes nearby spending categories and matches them with high-yield credit cards.

## ✨ Key Features

- 🌍 **Real-Time Location Detection** – Automatically identifies nearby businesses using AWS Location Service
- 💳 **Smart Card Matching** – Analyzes spending categories (restaurants, pharmacies, hotels, etc.) and recommends the highest cashback card
- 📊 **Instant Results** – Displays recommended card details with cashback percentages tailored to your location
- 🎨 **Modern UI** – Sleek, responsive design with smooth animations and intuitive navigation
- 📍 **Fallback Handling** – Gracefully handles mock data or unavailable APIs during development/testing

## 🌐 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript
- **AWS Integration:**
  - [AWS Location Service](https://aws.amazon.com/location/) – For geocoding and nearby place search
  - Custom backend API (simulated) – For credit card reward analysis

## 🚀 How It Works

1. **User Opens App** → Requests location permissions
2. **Geolocation** → Fetches GPS coordinates
3. **Reverse Geocoding** → Identifies nearby businesses via AWS Location Service
4. **Category Extraction** → Extracts spending categories (e.g., Dining, Pharmacy)
5. **Card Analysis** → Sends data to backend API (`/cards` endpoint) for reward calculation
6. **Recommendation Display** → Shows best card with cashback % and context


## ⚙️ Configuration

### Required Environment Variables / Config

Edit the `AWS_CONFIG` object inside the `<script>` tag in `index.html`:

```js
const AWS_CONFIG = {
    region: 'us-east-1',
    apiKey: "v1.public.eyJ...",        // Your AWS Location Service API Key
    endpoint: 'https://places.geo.us-east-1.amazonaws.com'
};
```

> ⚠️ **Important**: In production, move API keys to environment variables or AWS Cognito for secure access control.

## 📡 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://d1ehq4shptq79y.cloudfront.net/cards` | `POST` | Fetches credit card recommendations based on categories and location |
| `https://places.geo.us-east-1.amazonaws.com/v2/search-nearby` | `POST` | AWS Location Service – finds nearby businesses |



---

*Built with precision to turn location data into financial intelligence.* 💳📍
