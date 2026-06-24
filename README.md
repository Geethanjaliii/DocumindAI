# DocuMind AI

AI-powered document intelligence platform that automates OCR, document classification, structured data extraction, duplicate detection, search, and analytics.

## Overview

DocuMind AI helps organizations process large volumes of documents by extracting meaningful information using OCR and AI-powered analysis.

The platform supports document ingestion, classification, structured field extraction, duplicate invoice detection, document search, and analytics through a modern dashboard.

---

## Features

### Document Processing
- Multi-file document upload
- OCR text extraction
- PDF and image document support
- Document reprocessing

### AI-Powered Classification
- Invoice classification
- Receipt classification
- Purchase Order classification
- Other document detection

### Structured Data Extraction
Extracts key fields such as:
- Vendor Name
- Invoice Number
- Invoice Date
- Total Amount
- Currency
- Due Date

### Duplicate Detection
- Detect duplicate invoices
- Match based on invoice metadata
- Duplicate management workflow

### Search & Management
- Document search
- Filtering by type
- Status tracking
- Document history

### Analytics Dashboard
- Total documents processed
- Document type distribution
- Recent uploads
- Duplicate statistics
- Processing insights

### Authentication
- JWT Authentication
- Secure API access
- User-specific document management

---

## Architecture

```text
                ┌───────────────┐
                │ React Frontend│
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ FastAPI Backend│
                └───────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        ▼                               ▼
 ┌─────────────┐                 ┌─────────────┐
 │ Gemini AI   │                 │ PostgreSQL  │
 │ Classification & Extraction   │ Database    │
 └─────────────┘                 └─────────────┘
                        │
                        ▼
                 ┌──────────┐
                 │ Tesseract│
                 │ OCR      │
                 └──────────┘
```

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Vanilla CSS

### Backend
- FastAPI
- Python
- SQLAlchemy
- Alembic

### Database
- PostgreSQL
- Neon

### AI & OCR
- Google Gemini 2.5 Flash
- Tesseract OCR

### Authentication
- JWT Authentication

### Version Control
- Git
- GitHub

---

## Project Structure

```text
DocumindAI
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── services
│   │   ├── schemas
│   │   ├── repositories
│   │   ├── db
│   │   └── workers
│   │
│   └── migrations
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── services
│   │   ├── assets
│   │   └── screens
│   │
│   └── public
│
└── README.md
```

---

## API Modules

### Documents
- Upload documents
- List documents
- Get document details
- Delete documents
- Reprocess documents

### Search
- Search documents
- Filter results

### Duplicates
- List duplicate matches
- Update duplicate status

### Dashboard
- Statistics
- Recent documents
- Analytics data

### Authentication
- Register
- Login
- JWT token validation

---

## Screens

- Dashboard
- Document Upload
- Documents Management
- Document Details
- Duplicate Detection
- Analytics
- Search
- Login
- Registration

---

## Sample Workflow

1. Upload invoice PDF
2. OCR extracts text
3. Gemini classifies document
4. Structured fields extracted
5. Duplicate check performed
6. Results stored in PostgreSQL
7. Dashboard updated automatically

---

## Future Improvements

- RAG-based document Q&A
- Role-based access control
- Vector search
- Email ingestion
- Cloud deployment
- Webhook integrations
- Export to Excel/CSV
- Audit logs

---

## Author

**Geethanjali V N**

Computer Science Engineering Student  
Velammal Engineering College

---

## License

This project is developed for educational purposes.
