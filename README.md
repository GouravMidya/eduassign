# EduAssign

EduAssign is an innovative platform designed to tackle the challenge of overburdened teachers and the need for personalized feedback in education. By leveraging Google products like Gemini, Firebase, and Google Cloud, EduAssign assists teachers in providing detailed, personalized feedback while helping students identify their weaknesses and grow from them.

## Overview

Teachers today face the challenge of providing meaningful, personalized feedback to each student while managing large class sizes. EduAssign bridges this gap by:

- Automating initial assessment of student submissions
- Generating customized feedback based on student performance
- Identifying areas of improvement for each student
- Providing analytics to help teachers focus their attention where it's most needed

## Features

- **Automated Assignment Analysis**: Uses Gemini AI to evaluate student submissions
- **Personalized Feedback**: Generates tailored feedback addressing specific strengths and weaknesses
- **Progress Tracking**: Monitors student improvement over time
- **Analytics Dashboard**: Provides insights into class and individual performance
- **Secure Authentication**: Firebase authentication for secure user access
- **Cloud Storage**: Efficiently stores and manages assignments and feedback

## Project Setup

### Frontend (Next.js)

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/eduassign.git
cd eduassign/frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Firebase**

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Authentication, Storage and Firestore services
- Create a `.env.local` file by copying `.env.example`
- Replace the placeholder values with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=your_backend_api_url
```

4. **Run the development server**

```bash
npm run dev
```

### Backend (FastAPI)

1. **Navigate to the backend directory**

```bash
cd ../backend
```

2. **Set up a virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure Firebase Admin SDK**

- Go to your Firebase project settings
- Navigate to the "Service accounts" tab
- Click "Generate new private key" to download the JSON file
- Replace the sample `firebase-admin-sdk.json` file with your downloaded credentials

5. **Configure Gemini API**

- Create a Gemini API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a `.env` file by copying `.env.example`
- Add your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key
```

6. **Run the FastAPI server**

```bash
uvicorn main:app --reload
```

> **Note**: The backend has been tested and runs stably on Linux and Debian-based environments. Windows users may experience crashes due to encoding issues. If you encounter problems on Windows, consider using WSL (Windows Subsystem for Linux) or Docker for deployment.

## Deployment

Both frontend and backend components include Dockerfiles for easy deployment.

### Docker Deployment (Frontend)

```bash
cd frontend
docker build -t eduassign-frontend .
docker run -p 3000:3000 eduassign-frontend
```

### Docker Deployment (Backend)

```bash
cd backend
docker build -t eduassign-backend .
docker run -p 8000:8000 eduassign-backend
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Google Gemini for AI capabilities
- Firebase for authentication and database services
- Google Cloud for hosting and scalability