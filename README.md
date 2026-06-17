# Central Ride 🚗💨

Welcome to the **Central Ride** repository! This is a progressive campus transit web application designed for students, drivers, riders, and administrators to coordinate passenger rides and parcel deliveries in real-time.

This documentation is tailored specifically for **beginners** to help you understand the codebase architecture, navigate the folder structures, and understand how the application handles data under the hood.

---

## 🚀 Getting Started

To run the application locally on your computer, follow these simple steps:

1. **Install Dependencies**:
   Open your terminal inside the root directory (`Central Ride/`) and install all package requirements:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   Start the local live server:
   ```bash
   npm run dev
   ```
   *The terminal will output a local address (usually `http://localhost:5173`). Open this URL in your browser to view the application.*

---

## 🛠️ The Tech Stack

Before diving into the code, here is an overview of the core libraries and technologies used in this project:

*   **React**: A frontend library used for building user interfaces with reusable UI components.
*   **Vite**: A modern frontend build tool that serves code extremely fast during development.
*   **Firebase Authentication & Firestore**: Used to authenticate users (using Google Sign-In and email/password) and sync data in real-time.
*   **Leaflet (`react-leaflet`)**: An open-source interactive mapping library used to display maps, set markers, and draw driving paths.
*   **OSRM (Open Source Routing Machine)**: A free routing engine API that returns optimal route coordinate arrays between pins.
*   **Photon API**: A free geocoding lookup service used to search campus location names (like library or clinic) and convert them to latitude and longitude coordinates.

---

## 📁 Codebase Navigation Guide

Here is a map of the file structure under the `src/` directory to help you find where different features are implemented:

```text
src/
├── components/          # Reusable UI widgets and navigation layouts
│   ├── InteractiveMap.jsx  # Leaflet maps renderer, routing manager, and geocoder
│   ├── TopNav.jsx          # Header navigation bar (desktop view and user avatars)
│   ├── BottomNav.jsx       # Bottom tab bar (mobile view tab switching)
│   ├── Profile.jsx         # Profile settings form & local cache clearing helper
│   ├── Splash.jsx          # Pulsing onboarding loader animation page
│   ├── Login.jsx           # Sign-in role-selection and credentials handler
│   └── RoleSwitcher.jsx    # Developer shortcut button to toggle between roles
│
├── context/             # Global State Managers (Context API)
│   ├── AuthContext.jsx     # Handles user registration, Google Auth, and login sessions
│   └── MockDataContext.jsx # Subscribes to Firebase Firestore collections in real-time
│
├── views/               # Screen views separated by system role
│   ├── student/
│   │   ├── StudentHome.jsx      # Student booking engine, pricing modals, and active trip tracking
│   │   └── StudentHistory.jsx   # Lists past rides requested by the active student
│   │
│   ├── driver/
│   │   ├── DriverHome.jsx       # Driver board matching requests, OTP validation, and navigations
│   │   └── DriverEarnings.jsx   # Dashboard displaying today's and weekly totals
│   │
│   ├── admin/
│   │   ├── AdminDashboard.jsx   # Active counts, SOS emergency monitor, and rating switches
│   │   ├── AdminRatings.jsx     # Lists ratings by role with search filter and progress bars
│   │   └── AdminRecords.jsx     # Master database viewer listing all system transactions
│   
├── firebase.js          # Configures connections and credentials to Google Firebase services
├── index.css            # Global stylesheet containing responsive layouts and design tokens
├── main.jsx             # React entry file rendering routes wrapped by Context Providers
└── App.jsx              # Core application router mounting role-based interfaces
```

---

## 🔄 How Data Flows (A Beginner's walkthrough)

To understand how the app functions, let's trace how a ride progresses step-by-step:

### 1. The Context Layer (`src/context/`)
All application data lives in global context files so that any screen can access it without passing props down manually:
*   **`AuthContext.jsx`** listens to Firebase Auth. If a user logs in, it fetches their user document from Firestore's `users` collection.
*   **`MockDataContext.jsx`** establishes active listeners (via Firestore's `onSnapshot`) to `rides`, `alerts`, and `users` collections. Whenever a user edits a database value, the context immediately notifies all mounted React views.

### 2. Requesting a Ride (`src/views/student/StudentHome.jsx`)
*   The student enters a pickup and destination address (or clicks on the map).
*   `InteractiveMap.jsx` geocodes the text inputs using the **Photon API** to get `[lat, lng]`, calls the **OSRM API** to find coordinates along streets, and returns an ETA and calculated pricing.
*   When the student clicks "Find Ride", `requestRide()` runs in `MockDataContext.jsx`, creating a document in Firestore with `status: 'requested'`.

### 3. Accepting a Request (`src/views/driver/DriverHome.jsx`)
*   Drivers see the request pop up in their request board because they are listening to the `rides` collection where `status === 'requested'`.
*   A driver clicks "Accept", updating the status to `accepted` and assigning their user ID to the ride.
*   The student's view instantly updates to show the driver's name, vehicle details, and a 4-digit verification **OTP code**.

### 4. Navigating and Confirming
*   The driver drives to the student, clicks "Arrived at Pickup", changing the status to `arrived`.
*   Once the student enters the vehicle, the driver asks for the OTP. Entering the correct OTP triggers `startRide()`, updating status to `in_progress` and opening a deep link to **Google Maps** navigation on the driver's device.

### 5. Finalizing Payment and Feedback
*   When the driver clicks "Complete", status changes to `payment_pending`.
*   The student is prompted to send Mobile Money (MoMo) to the driver's phone number and click "I have paid", changing status to `student_rating`.
*   Both users rate each other out of 5 stars, updating their respective averages in the `users` Firestore collection, and the ride completes!

---

## 💡 Tips for Coding & Extending features

As a beginner, here are some important patterns to keep in mind when modifying files:

*   **React Hooks**: You will see standard hooks like `useState` (for tracking temporary UI state like input fields) and `useEffect` (for triggering side effects like network queries).
*   **Dynamic Class Names**: Component states often control styling. You will frequently find class names formatted dynamically:
    ```javascript
    className={`text-body-sm-strong ${ride.status === 'cancelled' ? 'text-danger' : 'text-success'}`}
    ```
*   **Map Coordinate Transformations**: Cloud Firestore does not support nested arrays of coordinates (like `[[lat, lng]]`). Therefore, routes are saved in Firestore as an array of objects `[{lat: X, lng: Y}]` and transformed into array shapes within `MockDataContext.jsx` so Leaflet can render them.

If you ever run into a cached version of the website when testing on mobile devices, go to the **Profile settings page** and click the red **FIX APP / CLEAR CACHE** button to force clean code updates!
