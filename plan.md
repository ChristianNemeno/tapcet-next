# Quiz App MVP Plan

## Overview

A full-stack Quiz Application built using:

### Frontend

* Next.js
* TypeScript
* Tailwind CSS

### Backend

* NestJS
* TypeScript
* Prisma ORM
* JWT Authentication

### Database

* PostgreSQL

### Infrastructure

* Docker Compose
* Docker
* Monorepo

---

# Goals

Build a minimal quiz platform that allows users to:

1. Register and Login
2. Create quizzes
3. Add questions
4. Take quizzes
5. View results

Everything else is considered post-MVP.

---

# Architecture

## Architecture Style

Feature-Based Modular Architecture

Instead of organizing by technical layers:

```text
controllers/
services/
repositories/
```

Organize by business features:

```text
auth/
quiz/
question/
attempt/
```

Each module owns its own:

* Controller
* Service
* Repository
* DTOs
* Validation
* Tests

Benefits:

* Easier maintenance
* Easier onboarding
* Better scalability
* Clear ownership of business logic
* Easier future migration to microservices

---

# Monorepo Structure

```text
quiz-app/
│
├── frontend/
│
├── backend/
│
├── docker-compose.yml
├── .env
└── README.md
```

---

# Frontend Structure (Next.js)

```text
frontend/
│
├── src/
│   │
│   ├── app/
│   │
│   ├── components/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── quiz/
│   │   └── attempt/
│   │
│   ├── hooks/
│   │
│   ├── services/
│   │
│   ├── lib/
│   │
│   ├── providers/
│   │
│   └── types/
│
├── public/
│
└── package.json
```

---

# Backend Structure (NestJS)

```text
backend/
│
├── src/
│   │
│   ├── modules/
│   │
│   │   ├── auth/
│   │   │
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── validators/
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── quiz/
│   │   │
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   ├── validators/
│   │   │   └── quiz.module.ts
│   │   │
│   │   ├── question/
│   │   │
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   └── question.module.ts
│   │   │
│   │   └── attempt/
│   │
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── dto/
│   │       └── attempt.module.ts
│   │
│   ├── common/
│   │
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── exceptions/
│   │   └── utils/
│   │
│   ├── prisma/
│   │
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── package.json
```

---

# MVP Features

## Authentication

### Register

Fields:

* Email
* Password

### Login

Fields:

* Email
* Password

### Logout

### Current User Endpoint

Authentication:

* JWT
* HTTP-only cookies

---

## Quiz Management

### Create Quiz

Fields:

* Title
* Description

### View My Quizzes

List all quizzes owned by logged-in user.

### Update Quiz

Edit title and description.

### Delete Quiz

Owner can delete quiz.

---

## Question Management

### Add Question

Question Type:

* Multiple Choice

Fields:

* Question Text
* Option A
* Option B
* Option C
* Option D
* Correct Answer

### Update Question

### Delete Question

### View Questions

---

## Quiz Taking

### Open Quiz

Display:

* Quiz Title
* Description
* Questions

### Submit Quiz

User submits answers.

Backend calculates score.

---

## Results

Display:

* Correct Answers
* Incorrect Answers
* Final Score
* Percentage

Example:

```text
Score: 8/10
Percentage: 80%
```

---

# Database Schema

## User

```sql
id UUID PRIMARY KEY
email VARCHAR UNIQUE
password_hash VARCHAR
created_at TIMESTAMP
```

## Quiz

```sql
id UUID PRIMARY KEY
title VARCHAR
description TEXT
owner_id UUID
created_at TIMESTAMP
```

## Question

```sql
id UUID PRIMARY KEY
quiz_id UUID
question_text TEXT
created_at TIMESTAMP
```

## Choice

```sql
id UUID PRIMARY KEY
question_id UUID
choice_text TEXT
is_correct BOOLEAN
```

## Attempt

```sql
id UUID PRIMARY KEY
user_id UUID
quiz_id UUID
score INTEGER
created_at TIMESTAMP
```

## Answer

```sql
id UUID PRIMARY KEY
attempt_id UUID
question_id UUID
selected_choice_id UUID
```

---

# API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Quiz

```http
GET    /api/quizzes
GET    /api/quizzes/:id

POST   /api/quizzes
PUT    /api/quizzes/:id
DELETE /api/quizzes/:id
```

## Question

```http
POST   /api/quizzes/:id/questions

PUT    /api/questions/:id
DELETE /api/questions/:id
```

## Attempt

```http
POST /api/quizzes/:id/submit

GET /api/attempts
GET /api/attempts/:id
```

---

# Frontend Pages

## Public

```text
/
```

Landing Page

```text
/login
```

Login Page

```text
/register
```

Register Page

```text
/quiz/[id]
```

Take Quiz Page

---

## Protected

```text
/dashboard
```

Dashboard

```text
/dashboard/quizzes
```

My Quizzes

```text
/dashboard/quizzes/create
```

Create Quiz

```text
/dashboard/quizzes/[id]
```

Manage Quiz

```text
/dashboard/results
```

Results

---

# Docker Compose Services

## frontend

Next.js application

## backend

NestJS application

## postgres

PostgreSQL database

---

# User Flow

## Quiz Creator

```text
Register
 ↓
Login
 ↓
Create Quiz
 ↓
Add Questions
 ↓
Publish Quiz
```

## Quiz Taker

```text
Open Quiz
 ↓
Answer Questions
 ↓
Submit Quiz
 ↓
View Results
```

---

# Out of Scope (Post-MVP)

* OAuth Login
* Google Login
* Quiz Categories
* Public Quiz Search
* Leaderboards
* Timed Quizzes
* Analytics Dashboard
* Question Images
* AI Question Generation
* Multiplayer Quizzes
* Certificates
* Notifications
* Admin Dashboard

---

# Development Phases

## Phase 1 - Infrastructure

* Monorepo Setup
* Docker Compose
* PostgreSQL
* Prisma
* Environment Configuration

## Phase 2 - Authentication

* Register
* Login
* Logout
* JWT Authentication

## Phase 3 - Quiz Module

* Create Quiz
* Update Quiz
* Delete Quiz
* List Quizzes

## Phase 4 - Question Module

* Create Questions
* Update Questions
* Delete Questions

## Phase 5 - Attempt Module

* Take Quiz
* Submit Quiz
* Score Quiz

## Phase 6 - Frontend Integration

* Authentication Pages
* Dashboard
* Quiz Builder
* Quiz Taking
* Results

## Phase 7 - Deployment

* Docker Images
* Production Configuration
* Database Migrations
* CI/CD Pipeline

---

# Definition of MVP Done

A user can:

1. Register an account
2. Login
3. Create a quiz
4. Add multiple-choice questions
5. Share the quiz URL
6. Take the quiz
7. Submit answers
8. View the final score

Once these are working end-to-end, the MVP is complete.
