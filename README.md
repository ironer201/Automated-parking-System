<div align="center">

# 🅿️ **SPACICO**
### *Smart RFID-Based Parking Management System*

**A full-stack IoT parking management solution — from embedded hardware to cloud database to mobile app to marketing website.**

[Key Features](#-key-features) · [Architecture](#-system-architecture) · [Tech Stack](#-tech-stack) · [Components](#-project-components) · [Getting Started](#-getting-started) · [Contact](#-team)

</div>

---

## 📌 Overview

**Spacico** is a comprehensive, RFID-gated parking management platform designed for private parking facilities — residential complexes, office buildings, and commercial lots. It integrates **embedded IoT hardware**, a **cloud-synced Python backend**, a **cross-platform mobile app**, and a **modern marketing website** into a single, cohesive ecosystem.

The system enables **automated entry/exit tracking** using RFID cards, **real-time occupancy monitoring** via a cloud database, **parking spot discovery and booking** through a mobile app, and **owner analytics dashboards** — all with a zero-human-intervention workflow.

> **Built as an Integrated Design Project (IDP)** — a year-long university capstone project by a team of 3 engineering students.

---

## 🎯 Key Features

<table>
<tr>
<td width="50%">

#### 🔐 Hardware Layer
- ESP32 + MFRC522 RFID reader integration
- Contactless card-based access control
- Visual LED feedback (green/red)
- Card provisioning utility for phone number encoding
- Custom serial communication protocol

</td>
<td width="50%">

#### ☁️ Backend Layer
- Supabase cloud database (PostgreSQL)
- Real-time entry/exit record synchronization
- Automatic duration tracking & timestamping
- Owner analytics aggregation (daily, monthly, total)
- JSON-based local caching for offline resilience

</td>
</tr>
<tr>
<td width="50%">

#### 📱 Mobile App Layer
- Cross-platform (Android & iOS) via React Native + Expo
- Interactive OpenStreetMap with Leaflet integration
- GPS-based nearby parking finder (2km radius)
- Full parking booking workflow
- Owner monitoring dashboard with earnings
- Secure authentication (email & phone)
- Vehicle registration & profile management

</td>
<td width="50%">

#### 🌐 Website Layer
- Fully responsive, dark-themed marketing site
- Animated scroll-reveal, 3D tilt, and glow effects
- Multi-page layout: Home, Download, Security, Team
- Zero framework dependency — pure HTML/CSS/JS
- Accessibility-conscious (prefers-reduced-motion)
- Performance-optimized animations

</td>
</tr>
</table>

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          SPACICO ECOSYSTEM                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐    Serial     ┌──────────────┐    HTTPS    ┌──────────────┐
│   │   ESP32 +   │◄────────────►│   Python     │◄───────────►│   Supabase   │
│   │   MFRC522   │   UART 9600  │   Backend    │   REST API  │  (PostgreSQL)│
│   │  RFID Card  │              │              │             │  Cloud DB    │
│   └─────────────┘              └──────────────┘             └──────┬───────┘
│                                                                     │
│                                    ┌───────────────┐               │
│                                    │  React Native │    Real-time   │
│                                    │  Mobile App   │◄──────────────►│
│                                    │  (Expo/RN)    │               │
│                                    └───────────────┘               │
│                                                                     │
│                                    ┌───────────────┐               │
│                                    │   Marketing   │    Static     │
│                                    │   Website     │◄──────────────►│
│                                    │  (HTML/CSS/JS)│   Pages       │
│                                    └───────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User taps RFID card on the reader → ESP32 reads card data via SPI
2. Data sent to Python script via serial (UART at 9600 baud)
3. Python script queries/updates Supabase cloud database
4. Mobile app reads from the same database for real-time monitoring
5. Owner dashboard reflects live entry/exit counts and analytics

---

## 💻 Tech Stack

<div align="center">

| Layer | Technologies |
|:---:|:---|
| **Embedded / IoT** | `ESP32` · `MFRC522 (MIFARE Classic 1K)` · `SPI Protocol` · `Arduino (C/C++)` |
| **Backend** | `Python 3` · `pyserial` · `Supabase SDK` · `dotenv` · `JSON` |
| **Mobile App** | `React Native 0.81` · `Expo 54` · `TypeScript` · `Expo Router` · `Leaflet.js` · `Reanimated` |
| **Database** | `Supabase (PostgreSQL)` · `AsyncStorage` |
| **Website** | `HTML5` · `CSS3 (Custom Properties, Grid, Animations)` · `Vanilla JavaScript` · `SVG` |
| **Mapping** | `OpenStreetMap` · `Leaflet.js` · `MarkerCluster` · `Haversine Formula` |
| **Auth** | `Supabase Auth` (Email + Phone) |
| **Build & Deploy** | `EAS Build (Expo)` · `Metro Bundler` |

</div>

---

## 📁 Project Components

### 1. 🔧 `Circuit/Code/` — Embedded Hardware & Python Backend

| File | Description |
|---|---|
| `C Code.c` | ESP32 firmware — RFID card reading/writing, LED feedback, serial protocol |
| `Python.py` | Main orchestration script — bridges ESP32 to Supabase cloud, handles entry/exit logic |
| `rfid_write.py` | Utility to encode phone numbers onto blank RFID cards |
| `COM_Finder.py` | Diagnostic tool to identify the ESP32's COM port |

**Key Logic:** Toggle-based entry/exit system — first scan = entry, second scan = exit. Automatically tracks duration, updates aggregate statistics, and provides LED feedback.

### 2. 📱 `Mobile/parking/` — React Native Mobile App ("Spacio")

| Screen | Functionality |
|---|---|
| `index.tsx` | Login with Supabase Auth (email + password) |
| `signup.tsx` | Account registration with profile creation |
| `landing.tsx` | Main dashboard with 6 quick-action tiles |
| `booking.tsx` | Full parking booking (GPS, vehicle, payment, duration) |
| `rent.tsx` | Interactive map showing available parking spots with clustering |
| `profile.tsx` | User profile management |
| `vehicles.tsx` | Vehicle registration (plate, model, color) |
| `OwnerMonitoring.tsx` | Owner analytics — entries, earnings, slot occupancy |
| `warning.tsx` | Security alerts for failed login attempts |
| `setting.tsx` | App settings and account management |

**14 screens** · **7 Supabase tables** · **GPS integration** · **6 payment methods** (Bkash, Nagad, Rocket, Cash, Card, Mobile Banking)

### 3. 🌐 `Website/Updated version/` — Marketing Website ("Spacico")

| Page | Content |
|---|---|
| `index.html` | Hero section, 6 feature cards, 3-step operational flow |
| `download.html` | App download page with phone mockup |
| `security.html` | RFID security features with animated shields and pulse effects |
| `contact.html` | Team profiles and corporate contact information |

**100% vanilla** — no frameworks, no libraries, no build tools. Hand-crafted CSS animations (12+ unique keyframe animations), 3D tilt effects, and responsive design across 3 breakpoints.

---

## 🚀 Getting Started

### Prerequisites

- **Hardware:** ESP32 dev board + MFRC522 RFID reader module
- **Software:** Python 3.8+, Node.js 18+, Expo CLI
- **Accounts:** [Supabase](https://supabase.com) project (free tier)

### Backend Setup

```bash
# Navigate to Circuit/Code directory
cd Circuit/Code

# Install Python dependencies
pip install pyserial supabase python-dotenv

# Create .env file with your Supabase credentials
echo "SUPABASE_URL=your_supabase_url" > .env
echo "SUPABASE_KEY=your_supabase_anon_key" >> .env

# Run the main RFID processing script
python Python.txt
```

### Mobile App Setup

```bash
# Navigate to Mobile/parking directory
cd Mobile/parking

# Install dependencies
npm install

# Start development server
npx expo start

# Build APK (via EAS)
eas build --platform android --profile preview
```

### Website

```bash
# Simply open index.html in any modern browser
# No build step required — pure static files
open Website/"Updated version"/index.html
```

### Hardware Wiring

```
MFRC522 RFID Reader    →    ESP32
─────────────────────────────────────
SDA  (SS)              →    GPIO 5
SCK                    →    GPIO 18
MOSI                   →    GPIO 23
MISO                   →    GPIO 19
RST                    →    GPIO 4
3.3V                   →    3.3V
GND                    →    GND

LED Green              →    GPIO 22
LED Red                →    GPIO 2 (built-in)
```

---

## 🗄 Database Schema

The system uses **7 Supabase tables** across the mobile app and backend:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles      │     │    record        │     │   allRecord      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ name            │     │ phone           │     │ phone           │
│ email           │     │ active (bool)   │     │ status (bool)   │
│ phone           │     │ Total_Entry     │     │ Entry           │
│ presentaddress  │     │ Total_Entry_Today│    │ OutGoing        │
│ permentaddress  │     │ updated_at      │     │ created_at      │
│ gender          │     └─────────────────┘     └─────────────────┘
└─────────────────┘
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│parking_bookings │     │ owner_record     │     │car_registrations│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ user_id         │     │ phone           │     │ user_id         │
│ latitude        │     │ total_entry     │     │ OwnerName       │
│ longitude       │     │ total_entry_today│    │ phone           │
│ vehicle_number  │     │ total_entry_month│    │ carCompany      │
│ duration_of_stay│     │ total_slot_active│    │ carColor        │
│ payment_amount  │     │ updated_at      │     │ carLicense      │
│ pricing_type    │     └─────────────────┘     └─────────────────┘
└─────────────────┘
┌─────────────────┐
│  login_events   │
├─────────────────┤
│ user_id         │
│ identifier      │
│ platform        │
│ logged_in_at    │
└─────────────────┘
```

---

## 📊 Feature Highlights

| Capability | Implementation |
|---|---|
| **Contactless Access** | RFID MIFARE Classic cards encoded with phone numbers |
| **Entry/Exit Toggle** | Database-driven `active` boolean — first scan enters, second exits |
| **Duration Tracking** | Automatic timestamp calculation between entry and exit |
| **GPS Parking Finder** | Haversine formula for 2km nearby filtering + Leaflet map clustering |
| **Multi-payment Support** | 6 methods: Bkash, Nagad, Rocket, Cash, Card, Mobile Banking |
| **Owner Analytics** | Daily/monthly/total entries, active slots, earnings calculation |
| **Real-time Sync** | Supabase cloud as single source of truth across all clients |
| **Offline Resilience** | Local JSON caching for card data and entry timestamps |
| **Visual Feedback** | LED indicators (green = valid, red = invalid) on hardware |
| **Animated Website** | 3D tilt, scroll-reveal, floating orbs, shimmer effects |

---

## 🎨 Website Design

The marketing website features a **dark cyberpunk aesthetic** with:

- **Color palette:** Deep black (`#050806`) with electric green (`#0f9d58`) accents
- **Typography:** Inter (Google Fonts) — weights 400 through 800
- **Animations:** 12+ custom `@keyframes` animations
- **Interactive effects:** Mouse-tracking 3D card tilt, hover glow, scroll-reveal
- **Responsive:** 3 breakpoints (900px, 640px, 480px)
- **Accessibility:** `prefers-reduced-motion` media query support

---

## 👥 Team

<table>
<tr>
<td align="center">
<img src="pic/my.jpg" width="100" height="100" style="border-radius:50%"/><br/>
<b>Md. Zarif Noor</b><br/>
<sub>Lead Developer</sub><br/>
<sub>Software & Hardware</sub>
</td>
<td align="center">
<img src="pic/touki.jpeg" width="100" height="100" style="border-radius:50%"/><br/>
<b>Townid Alam Touki</b><br/>
<sub>Lead Team Management</sub><br/>
<sub>Project Coordination</sub>
</td>
<td align="center">
<img src="pic/mon.jpeg" width="100" height="100" style="border-radius:50%"/><br/>
<b>Jannatul Naima Moon</b><br/>
<sub>Lead Design Team</sub><br/>
<sub>UI/UX Design</sub>
</td>
</tr>
</table>

---

## 📈 Skills Demonstrated

> **This project showcases proficiency across the full technology spectrum:**

| Category | Skills |
|---|---|
| **Embedded Systems** | ESP32 programming, SPI protocol, RFID/NFC, sensor integration, serial communication |
| **Backend Development** | Python, REST API integration, cloud database management, JSON caching |
| **Mobile Development** | React Native, Expo, TypeScript, cross-platform UI, navigation patterns |
| **Frontend Development** | HTML5, CSS3, vanilla JavaScript, responsive design, CSS animations |
| **Database Design** | PostgreSQL (via Supabase), relational schema design, real-time data sync |
| **Mapping & Geolocation** | OpenStreetMap, Leaflet.js, GPS integration, Haversine distance formula |
| **Authentication** | Supabase Auth, session management, login event tracking |
| **DevOps & Build** | EAS Build, Metro bundler, environment configuration |
| **System Integration** | IoT-to-cloud pipeline, multi-component architecture, protocol design |

---

## 📜 License

This project was developed as part of the **Integrated Design Project (IDP)** coursework.

---

<div align="center">

**Built with dedication over one year of collaborative engineering.**

*From soldering circuits to shipping mobile apps — this is what full-stack means.*

![Visitor Count](https://komarev.com/ghpvc/?username=spacico&color=green&style=flat-square)

</div>
