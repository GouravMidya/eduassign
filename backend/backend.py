import os
import json
import uuid
import tempfile
import re
from typing import List, Optional
from datetime import datetime
import asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import firebase_admin
from firebase_admin import credentials, firestore, storage
from pyzerox import zerox
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Assignment Management System", 
              description="API for managing assignments, submissions, and evaluations")

# Define allowed origins
origins = [
    "*",  # Frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize Firebase (assuming you have a serviceAccount.json file)
os.getcwd()
cred = credentials.Certificate(os.path.join(os.getcwd(), "solution-challenge-eduassign.json" ))
firebase_admin.initialize_app(cred, {
    'storageBucket': 'solution-challenge-eduassign.firebasestorage.app'
})

# Get Firestore and Storage clients
db = firestore.client()
bucket = storage.bucket()

# LLM Configuration
model = "gemini/gemini-2.0-flash"
# Load the key from .env file
os.environ['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")

# Updated simplified prompts
ASSIGNMENT_EXTRACTION_PROMPT = """
Extract the full content of this assignment document in markdown format. 
Include all sections, questions, instructions and marking schemes as they appear.
Format equations, code blocks, and other special content appropriately in markdown.
"""

SUBMISSION_EXTRACTION_PROMPT = """
Extract the full content of this student submission document in markdown format.
Preserve all answers, formatting, equations, diagrams descriptions, and code snippets.
Maintain the original question numbering or references if present.
"""

# Feedback Categories
feedback_categories = [
    {
        "id": 1,
        "name": "Conceptual Understanding",
        "description": "Evaluation of fundamental concept understanding",
    },
    {
        "id": 2,
        "name": "Technical Accuracy",
        "description": "Correctness of technical content",
    },
    {
        "id": 3,
        "name": "Presentation",
        "description": "Organization and clarity of presentation",
    },
    {
        "id": 4, 
        "name": "Clarity of Expression", 
        "description": "How clearly ideas are communicated"
    },
    {
        "id": 5, 
        "name": "Problem-Solving Approach", 
        "description": "Methodology used to tackle problems"
    },
    {
        "id": 6, 
        "name": "Improvement Areas", 
        "description": "Specific aspects where student can improve"
    },
]

# Helper Functions
async def extract_markdown_from_file(file_path: str, system_prompt: str):
    """Extract markdown content from PDF using pyzerox with custom prompt."""
    output_dir = tempfile.mkdtemp()
    result = await zerox(
        file_path=file_path,
        model=model,
        output_dir=output_dir,
        custom_system_prompt=system_prompt
    )
    
    # Concatenate content from all pages
    extracted_content = ""
    if hasattr(result, 'pages') and result.pages:
        for page in result.pages:
            extracted_content += page.content + "\n\n"
    
    return extracted_content

async def process_assignment_pdf(file_path: str):
    """Extract markdown content from assignment PDF."""
    return await extract_markdown_from_file(file_path, ASSIGNMENT_EXTRACTION_PROMPT)

async def process_submission_pdf(file_path: str):
    """Extract markdown content from submission PDF."""
    return await extract_markdown_from_file(file_path, SUBMISSION_EXTRACTION_PROMPT)


async def run_evaluation(assignment_id: str, submission_id: str):
    """
    Evaluate a submission using Google's Gemini LLM and update the database with feedback.
    """
    # Get assignment and submission data from Firestore
    assignment_ref = db.collection('assignments').document(assignment_id)
    submission_ref = db.collection('submissions').document(submission_id)
    assignment = assignment_ref.get().to_dict()
    submission = submission_ref.get().to_dict()
    
    # Get assignment and submission content
    assignment_content = assignment.get("extracted_content", "")
    submission_content = submission.get("extracted_content", "")
    
    # Create evaluation prompt for LLM
    prompt = f"""
    You are an expert teacher evaluating student assignments. You have:
    1. The assignment content:
    ```
    {assignment_content}
    ```
    2. The student's submission:
    ```
    {submission_content}
    ```
    Please evaluate the student's work and provide:
    1. Question-wise feedback and marks for each identifiable question answered
    2. Different types of feedback based on these categories:
    {json.dumps(feedback_categories, indent=2)}
    3. Overall feedback and total marks
    Format your response as JSON with this structure:
    {{
    "question_evaluations": [
      {{
        "question_reference": "Q1" or similar indicator,
        "marks_awarded": number,
        "max_marks": number (estimate based on assignment),
        "feedback": [
          {{
            "category_id": number (from the categories above),
            "text": "specific feedback text"
          }}
        ]
      }}
    ],
    "overall_feedback": "comprehensive feedback on the entire submission",
    "overall_marks": number (total awarded),
    "max_possible_marks": number (total available, estimate if needed)
    }}
    
    Important: Return ONLY the JSON response with no markdown formatting, explanations, or other text.
    """
    
    try:
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')
        
        # Call the Gemini API with the prompt
        response = await model.generate_content_async(prompt)
        
        # Get response text
        response_text = response.text
        
        # Check if response is wrapped in markdown code block and extract the JSON
        if response_text.startswith("```") and ("```" in response_text[3:]):
            # Extract content between the markdown code blocks
            start_idx = response_text.find("\n") + 1  # Skip the first line with ```json
            end_idx = response_text.rfind("```")
            response_text = response_text[start_idx:end_idx].strip()
        
        # Parse the extracted JSON
        try:
            evaluation_result = json.loads(response_text)
        except json.JSONDecodeError as e:
            # Log the problematic response for debugging
            print(f"Failed to parse JSON. Response text: {response_text[:500]}...")
            raise
        
        # Validate the structure of the response
        if not all(key in evaluation_result for key in ["question_evaluations", "overall_feedback", "overall_marks", "max_possible_marks"]):
            raise ValueError("Incomplete evaluation result from LLM")
        
        # Update submission with evaluation results in Firestore
        submission_ref.update({
            "ai_processing_status": "completed",
            "evaluation_result": evaluation_result,
            "overall_feedback": evaluation_result["overall_feedback"],
            "overall_marks": evaluation_result["overall_marks"],
            "max_possible_marks": evaluation_result["max_possible_marks"]
        })
        
        return evaluation_result
        
    except GoogleAPIError as e:
        # Handle API errors (e.g., rate limits, authentication issues)
        error_message = f"Gemini API error: {str(e)}"
        submission_ref.update({
            "ai_processing_status": "failed",
            "error_message": error_message
        })
        raise
        
    except json.JSONDecodeError:
        # Handle issues with parsing the response
        error_message = "Failed to parse LLM response as JSON"
        submission_ref.update({
            "ai_processing_status": "failed", 
            "error_message": error_message,
            "raw_response": response_text if 'response_text' in locals() else None
        })
        raise
        
    except Exception as e:
        # Handle any other unexpected errors
        error_message = f"Error during evaluation: {str(e)}"
        submission_ref.update({
            "ai_processing_status": "failed",
            "error_message": error_message
        })
        raise


# API Endpoints
@app.post("/assignments/")
async def create_assignment(
    background_tasks: BackgroundTasks,
    creator_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(...), 
    file: UploadFile = File(...)
):
    """
    Teacher submits a new assignment with PDF file.
    """
    try:
        # Generate a new UUID for the assignment
        assignment_id = str(uuid.uuid4())
        
        # Save PDF temporarily
        temp_file_path = f"temp/temp_{assignment_id}.pdf"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Process PDF in background to extract content
        background_tasks.add_task(process_and_store_assignment, 
                                 assignment_id, 
                                 creator_id, 
                                 title, 
                                 description, 
                                 temp_file_path)
        
        return {"assignment_id": assignment_id, "status": "processing"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating assignment: {str(e)}")

async def process_and_store_assignment(assignment_id: str, creator_id: str, title: str, 
                                      description: str, file_path: str):
    """Process assignment PDF and store in Firebase."""
    try:
        # Extract markdown content from PDF
        extracted_content = await process_assignment_pdf(file_path)
        
        # Create assignment record in Firestore
        assignment_data = {
            "id": assignment_id,
            "creator_id": creator_id,
            "title": title,
            "description": description,
            "created_at": datetime.now(),
            "status": "active",
            "document_url": f"assignments/{assignment_id}.pdf",
            "extracted_content": extracted_content
        }
        
        # Create the assignment document
        db.collection('assignments').document(assignment_id).set(assignment_data)
        
        # Upload PDF to Firebase Storage
        blob = bucket.blob(f"assignments/{assignment_id}.pdf")
        blob.upload_from_filename(file_path)
        
        # Clean up temp file
        os.unlink(file_path)
        
    except Exception as e:
        print(f"Error processing assignment: {str(e)}")
        # Update assignment status to indicate error
        db.collection('assignments').document(assignment_id).update({
            "status": "error",
            "error_message": str(e)
        })

@app.post("/submissions/")
async def create_submission(
    background_tasks: BackgroundTasks,
    assignment_id: str = Form(...),
    student_id: str = Form(...),
    student_name: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Student submits an assignment attempt.
    """
    try:
        # Generate a new UUID for the submission
        submission_id = str(uuid.uuid4())
        
        # Save PDF temporarily
        temp_file_path = f"temp/temp_{submission_id}.pdf"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Process submission in background
        background_tasks.add_task(process_and_store_submission, 
                                 submission_id, 
                                 assignment_id, 
                                 student_id,
                                 student_name, 
                                 temp_file_path)
        
        return {"submission_id": submission_id, "status": "processing"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating submission: {str(e)}")

async def process_and_store_submission(submission_id: str, assignment_id: str, 
                                      student_id: str, student_name: str, file_path: str):
    """Process submission PDF and store in Firebase."""
    try:
        # Extract markdown content from PDF
        extracted_content = await process_submission_pdf(file_path)
        
        # Get assignment to access info
        assignment_ref = db.collection('assignments').document(assignment_id)
        assignment = assignment_ref.get()
        
        if not assignment.exists:
            raise ValueError(f"Assignment {assignment_id} not found")
            
        assignment_data = assignment.to_dict()
        
        # Create submission record in Firestore
        submission_data = {
            "id": submission_id,
            "assignment_id": assignment_id,
            "student_id": student_id,
            "student_name": student_name,
            "submitted_at": datetime.now(),
            "status": "submitted",
            "document_url": f"submissions/{submission_id}.pdf",
            "ai_processing_status": "pending",
            "extracted_content": extracted_content
        }
        
        db.collection('submissions').document(submission_id).set(submission_data)
        
        # Upload PDF to Firebase Storage
        blob = bucket.blob(f"submissions/{submission_id}.pdf")
        blob.upload_from_filename(file_path)
        
        # Clean up temp file
        os.unlink(file_path)
        
        # Update submission status to indicate completion
        db.collection('submissions').document(submission_id).update({
            "status": "processed"
        })
        
    except Exception as e:
        print(f"Error processing submission: {str(e)}")
        # Update submission status to indicate error
        db.collection('submissions').document(submission_id).update({
            "status": "error",
            "error_message": str(e)
        })

@app.post("/evaluate/{assignment_id}/{submission_id}")
async def evaluate_submission(
    assignment_id: str, 
    submission_id: str,
    background_tasks: BackgroundTasks
):
    """
    Teacher requests evaluation of a student submission.
    """
    try:
        # Check if submission exists
        submission_ref = db.collection('submissions').document(submission_id)
        submission = submission_ref.get()
        
        if not submission.exists:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        submission_data = submission.to_dict()
        
        if submission_data.get('assignment_id') != assignment_id:
            raise HTTPException(status_code=400, detail="Submission does not match assignment")
        
        # Update submission status
        submission_ref.update({
            "ai_processing_status": "processing"
        })
        
        # Start evaluation in background
        background_tasks.add_task(run_evaluation, assignment_id, submission_id)
        
        return {"status": "Evaluation started", "submission_id": submission_id}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting evaluation: {str(e)}")

@app.get("/assignments/")
async def list_assignments():
    """List all assignments."""
    try:
        assignments = []
        for doc in db.collection('assignments').stream():
            assignment = doc.to_dict()
            # Remove the large extracted_content field from the response
            if "extracted_content" in assignment:
                assignment["has_extracted_content"] = True
                del assignment["extracted_content"]
            assignments.append(assignment)
        return assignments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing assignments: {str(e)}")

@app.get("/assignments/{assignment_id}/submissions")
async def list_submissions_for_assignment(assignment_id: str):
    """List all submissions for a specific assignment."""
    try:
        submissions = []
        for doc in db.collection('submissions').where('assignment_id', '==', assignment_id).stream():
            submission = doc.to_dict()
            # Remove the large extracted_content field from the response
            if "extracted_content" in submission:
                submission["has_extracted_content"] = True
                del submission["extracted_content"]
            submissions.append(submission)
        return submissions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing submissions: {str(e)}")

@app.get("/students/{student_id}/submissions")
async def list_student_submissions(student_id: str):
    """List all submissions made by a specific student."""
    try:
        submissions = []
        for doc in db.collection('submissions').where('student_id', '==', student_id).stream():
            submission = doc.to_dict()
            
            # Get assignment details for each submission
            assignment_ref = db.collection('assignments').document(submission['assignment_id'])
            assignment = assignment_ref.get().to_dict()
            
            # Add assignment details to submission
            submission['assignment'] = {
                'title': assignment.get('title', ''),
                'description': assignment.get('description', '')
            }
            
            # Remove the large extracted_content field from the response
            if "extracted_content" in submission:
                submission["has_extracted_content"] = True
                del submission["extracted_content"]
                
            submissions.append(submission)
        return submissions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing student submissions: {str(e)}")

@app.get("/submissions/{submission_id}/feedback")
async def get_submission_feedback(submission_id: str):
    """Get detailed feedback for a submission."""
    try:
        # Get submission data
        submission_ref = db.collection('submissions').document(submission_id)
        submission = submission_ref.get()
        
        if not submission.exists:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        submission_data = submission.to_dict()
        
        # Extract evaluation result
        evaluation_result = submission_data.get("evaluation_result", {})
        
        # Create response object
        response = {
            'submission_id': submission_id,
            'assignment_id': submission_data.get('assignment_id', ''),
            'student_id': submission_data.get('student_id', ''),
            'question_evaluations': evaluation_result.get('question_evaluations', []),
            'overall_feedback': evaluation_result.get('overall_feedback', ''),
            'overall_marks': evaluation_result.get('overall_marks', 0),
            'max_possible_marks': evaluation_result.get('max_possible_marks', 0),
            'feedback_categories': feedback_categories
        }
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting feedback: {str(e)}")

@app.get("/assignments/{assignment_id}")
async def get_assignment_details(assignment_id: str, include_content: bool = False):
    """Get detailed information about an assignment."""
    try:
        # Get assignment data
        assignment_ref = db.collection('assignments').document(assignment_id)
        assignment = assignment_ref.get()
        
        if not assignment.exists:
            raise HTTPException(status_code=404, detail="Assignment not found")
            
        assignment_data = assignment.to_dict()
        
        # Optionally include or exclude the extracted content
        if not include_content and "extracted_content" in assignment_data:
            assignment_data["has_extracted_content"] = True
            del assignment_data["extracted_content"]
            
        return assignment_data
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting assignment details: {str(e)}")

@app.get("/submissions/{submission_id}")
async def get_submission_details(submission_id: str, include_content: bool = False):
    """Get detailed information about a submission."""
    try:
        # Get submission data
        submission_ref = db.collection('submissions').document(submission_id)
        submission = submission_ref.get()
        
        if not submission.exists:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        submission_data = submission.to_dict()
        
        # Optionally include or exclude the extracted content
        if not include_content and "extracted_content" in submission_data:
            submission_data["has_extracted_content"] = True
            del submission_data["extracted_content"]
            
        return submission_data
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting submission details: {str(e)}")

# Add these new endpoints after your existing endpoints, before the if __name__ == "__main__" block

@app.put("/submissions/{submission_id}/feedback")
async def update_submission_feedback(submission_id: str, feedbackData: dict):
    """Update feedback for a submission."""
    try:
        # Get submission reference
        submission_ref = db.collection('submissions').document(submission_id)
        submission = submission_ref.get()
        
        if not submission.exists:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        # Update the evaluation result with new feedback
        submission_ref.update({
            "evaluation_result": feedbackData,
            "overall_feedback": feedbackData.get("overall_feedback", ""),
            "overall_marks": feedbackData.get("overall_marks", 0),
            "max_possible_marks": feedbackData.get("max_possible_marks", 0),
            "last_modified": datetime.now(),
            "modified_by": "teacher"  # You might want to pass teacher_id as parameter
        })
        
        return {"status": "success", "message": "Feedback updated successfully"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating feedback: {str(e)}")

@app.post("/submissions/{submission_id}/approve-feedback")
async def approve_submission_feedback(submission_id: str):
    """Approve feedback for a submission and make it visible to student."""
    try:
        # Get submission reference
        submission_ref = db.collection('submissions').document(submission_id)
        submission = submission_ref.get()
        
        if not submission.exists:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        # Update submission status to indicate feedback is approved
        submission_ref.update({
            "feedback_status": "approved",
            "feedback_approved_at": datetime.now(),
            "feedback_visible_to_student": True
        })
        
        return {"status": "success", "message": "Feedback approved and made visible to student"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving feedback: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)