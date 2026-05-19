# Add to the top of your README.md:
# ⚠️ Beta — UI overhaul in progress
# Vouch - Immutable Code Notary & Proof of Integrity

Vouch is a premium, cryptographically secure platform for code notarization and verification. It enables developers to prove the integrity of their work by recording structural code hashes on an immutable ledger, anchored to the Polygon blockchain.

---

## 🚀 Key Features

- **Structural Code Hashing**: Uses AST-based normalization to ensure hashes remain consistent even with changes in whitespace, comments, or formatting.
- **Supabase Ledger**: High-performance, real-time storage for all submission records with built-in Row Level Security (RLS).
- **Blockchain Anchoring (Polygon Amoy)**: Daily automated anchoring of ledger state to the Polygon Amoy testnet, providing decentralized proof of existence.
- **Cryptographic Signatures**: Every certificate is digitally signed using RSA-PSS, ensuring authenticity and non-repudiation.
- **Automated Email Certificates**: Instant delivery of official notarization certificates via **Resend API**.
- **Public Verification Portal**: A dedicated `/verify` route allowing anyone to validate a certificate's authenticity using a unique verification code.
- **Premium Dashboard**: A state-of-the-art React interface with dark mode, real-time notifications, and interactive documentation.

---

## 🏗 Architecture

### **Frontend**
- **React (Vite)**: Modern, responsive single-page application.
- **Tailwind CSS**: Custom design system with rich aesthetics and micro-animations.
- **Lucide React**: Premium iconography.
- **Context API**: Managed state for authentication and global notifications.

### **Backend**
- **FastAPI (Python)**: Asynchronous API engine.
- **Supabase**: Managed Postgres database and authentication.
- **Polygon (Web3.py)**: Blockchain integration for anchoring.
- **Resend**: Transactional email delivery.
- **ReportLab**: Professional PDF generation for certificates.

---

## 📂 Project Structure

```bash
vouch_pro/
├── backend/              # FastAPI Python Backend
│   ├── api.py            # Main API entry point
│   ├── hasher.py         # Structural hashing logic
│   ├── certificate.py    # PDF generation engine
│   ├── signer.py         # RSA-PSS signing logic
│   ├── mailer.py         # Resend email integration
│   ├── anchor.py         # Blockchain anchoring service
│   └── requirements.txt  # Python dependencies
├── frontend/             # React + Vite Frontend
│   ├── src/
│   │   ├── pages/        # Dashboard, Verification, Documentation
│   │   ├── components/   # UI Library and Layouts
│   │   └── context/      # Auth & Notification State
│   └── vite.config.js    # Build and Proxy configuration
└── .gitignore            # Project exclusion rules
```

---

## 🛠 Setup & Installation

### **1. Backend (Python)**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure `.env` (see Environment Variables section).
4. Run the API:
   ```bash
   python3 api.py
   ```

### **2. Frontend (React)**
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables

### **Backend (.env)**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SECRET_KEY=your_jwt_secret
POLYGON_RPC_URL=your_rpc_endpoint
WALLET_PRIVATE_KEY=your_wallet_key
RESEND_API_KEY=your_resend_key
FRONTEND_URL=http://localhost:5173
```

---

## ⚖️ License

Built with a commitment to academic integrity and cryptographic transparency.
