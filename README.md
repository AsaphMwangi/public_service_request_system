# Murang'a County eCitizen Public Service Request Portal

**Live Application:** [https://publicservicerequestsystem.asaphmwangi.site/](https://publicservicerequestsystem.asaphmwangi.site/)

## Overview
The Murang'a County eCitizen Public Service Request Portal is a full stack web application built to streamline municipal issue reporting, tracking, and resolution between citizens and county administrators. It features real time cloud data synchronization, automated transactional email alerts, role based access control, and secure cloud object storage for photo evidence.

## Key Features
* **Citizen Issue Reporting:** Residents can report public service issues across categories including Roads and Transport, Water and Sanitation, Waste Management, Street Lighting, and Public Health.
* **Live Camera and Gallery Integration:** Supports direct device camera capture via the browser MediaDevices API and gallery image uploads for visual evidence.
* **Secure Cloud Object Storage:** Uploaded images are stored in Cloudflare R2 and served using dynamically generated presigned S3 URLs to ensure strict data privacy.
* **Role Based Access Control:** Three tier permission architecture separating Citizens, System Moderators, and the Main County Administrator.
* **Moderator Management:** The main administrator can grant or revoke moderator privileges for verified registered users via a dedicated security panel and protected API routes.
* **Real Time Analytics Dashboard:** Tracks total submissions, open cases (Pending and In Progress), resolved cases, and overall resolution progress percentages.
* **Automated Email Notifications:** Integrated with the Enginemailer REST API to dispatch instant HTML status updates to both citizens and administrators upon submission and status changes.
* **Adaptive Mobile Design:** Responsive card and table layouts that automatically adjust to device system themes (Dark and Light mode) for optimal legibility on mobile and desktop screens.

## Technology Stack
* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
* **Backend:** Next.js Serverless API Routes
* **Authentication and Database:** Firebase Authentication, Cloud Firestore
* **Object Storage:** Cloudflare R2 with AWS S3 SDK and Request Presigner
* **Email Service:** Enginemailer REST API v2
* **Deployment:** Vercel

## System Architecture and Security
1. **Authentication Flow:** Firebase Authentication manages session states, while custom role verification routes users to either the Citizen Portal or the County Admin Dashboard.
2. **Protected Endpoints:** Moderator management endpoints validate the requester identity on the server before executing database mutations.
3. **Presigned Media Delivery:** Bucket objects remain private by default; the backend generates temporary 1 hour signed URLs whenever authorized users request issue records.

## Local Setup

### Prerequisites
* Node.js 20 or higher
* Firebase project with Authentication and Firestore enabled
* Cloudflare R2 bucket and API credentials
* Enginemailer account and verified sender domain

### Installation
```bash
git clone [https://github.com/AsaphMwangi/public_service_request_sytem.git](https://github.com/AsaphMwangi/public_service_request_sytem.git)
cd public_service_request_sytem
npm install
