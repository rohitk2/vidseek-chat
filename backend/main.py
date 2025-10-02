from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from moviepy.editor import VideoFileClip
import whisper
from best_video_segments import find_best_segments as find_segments
import google.generativeai as genai
import os
import json
import glob
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI(debug=True)

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Session storage - in production, use Redis or database
session_store = {}

# Function to generate localhost origins for a port range
def generate_localhost_origins(start_port: int, end_port: int) -> List[str]:
    return [f"http://localhost:{port}" for port in range(start_port, end_port + 1)]

# Generate origins from port 5173 to 6200 (extended range)
origins = generate_localhost_origins(5173, 6200) + [
    "http://localhost:8080",  # Keep existing port 3000
    "http://localhost:8081"
    "http://localhost:3000"
]

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    import os
    import uuid
    import shutil
    
    print("Video Uploaded")
    
    # Create videos directory if it doesn't exist
    videos_dir = os.path.join(os.path.dirname(__file__), "video")
    
    # If directory exists, remove all contents
    if os.path.exists(videos_dir):
        shutil.rmtree(videos_dir)
    
    # Create fresh videos directory
    os.makedirs(videos_dir, exist_ok=True)
    
    # Generate unique filename to avoid conflicts
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(videos_dir, unique_filename)
    
    # Save the uploaded video file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Convert MP4 to WAV
    wav_path = mp4_to_wav(file_path)
    
    # Generate transcript from WAV
    transcript_text = wav_to_transcript(wav_path)
    
    # Create transcript directory
    transcript_dir = os.path.join(os.path.dirname(__file__), "transcript")
    
    # If directory exists, remove all contents
    if os.path.exists(transcript_dir):
        shutil.rmtree(transcript_dir)
    
    # Create fresh transcript directory
    os.makedirs(transcript_dir, exist_ok=True)
    
    # Save transcript to JSON file
    transcript_filename = f"{uuid.uuid4().hex[:8]}_{os.path.splitext(file.filename)[0]}_transcript.json"
    transcript_path = os.path.join(transcript_dir, transcript_filename)
    
    with open(transcript_path, "w", encoding="utf-8") as transcript_file:
        transcript_file.write(transcript_text)
    
    # Clean up WAV file (optional)
    os.remove(wav_path)
    
    return {
        "message": "Video uploaded and transcribed successfully", 
        "filename": file.filename, 
        "saved_as": unique_filename,
        "transcript_file": transcript_filename,
        "transcript_text": transcript_text
    }

@app.post("/find-best-segments")
async def find_best_segments(request: Request):
    """
    Find the best video segments based on search query
    """
    def format_timestamp(seconds):
        """Convert seconds to MM:SS format"""
        minutes = int(seconds // 60)
        seconds = int(seconds % 60)
        return f"{minutes}:{seconds:02d}"
    
    try:
        # Read the request body as text
        search_query = (await request.body()).decode('utf-8')
        
        # Call the function from best_video_segments.py
        segments = find_segments(search_query)
        
        # Add formatted timestamps to each segment
        formatted_segments = []
        for segment in segments:
            formatted_segment = {
                "start": segment["start"],
                "end": segment["end"],
                "relevance_score": segment["relevance_score"],
                "explanation": segment["explanation"],
                "timestamp_display": f"{format_timestamp(segment['start'])} - {format_timestamp(segment['end'])}"
            }
            formatted_segments.append(formatted_segment)
        
        return {
            "status": "success",
            "query": search_query,
            "segments": formatted_segments
        }
    except Exception as e:
        print(f"Error finding segments: {str(e)}")
        return {
            "status": "error",
            "query": search_query if 'search_query' in locals() else "",
            "error": str(e),
            "segments": []
        }

def mp4_to_wav(video_path):
    """Convert MP4 video to WAV audio file"""
    # Load the video file
    video = VideoFileClip(video_path)
    
    # Extract the audio
    audio = video.audio
    
    # Generate WAV file path
    wav_path = video_path.replace('.mp4', '.wav')
    
    # Write the audio to a file
    audio.write_audiofile(wav_path)
    
    # Clean up
    audio.close()
    video.close()
    
    return wav_path

def wav_to_transcript(audio_file):
    """Convert WAV audio file to transcript chunks with timestamps"""
    import json
    
    try:
        # Load a Whisper model
        model = whisper.load_model("base")
        
        # Transcribe the audio file
        result = model.transcribe(audio_file)
        
        # Create 20-second chunks
        chunks = []
        chunk_duration = 20.0
        
        # Get total duration
        total_duration = result.get('segments', [])[-1]['end'] if result.get('segments') else 0
        
        current_start = 0.0
        while current_start < total_duration:
            chunk_end = min(current_start + chunk_duration, total_duration)
            
            # Collect text for this time range
            chunk_text = ""
            for segment in result.get('segments', []):
                if segment['start'] >= current_start and segment['start'] < chunk_end:
                    chunk_text += segment['text'] + " "
            
            if chunk_text.strip():
                chunks.append({
                    "start": current_start,
                    "end": chunk_end,
                    "text": chunk_text.strip()
                })
            
            current_start = chunk_end
        
        return json.dumps(chunks, indent=2)
        
    except Exception as e:
        print(f"Error in wav_to_transcript: {e}")
        # Fallback to simple transcript
        model = whisper.load_model("base")
        result = model.transcribe(audio_file)
        return result["text"]

class ChatMessage(BaseModel):
    message: str
    video_filename: str = None

def load_transcript_context():
    """Load transcript from JSON file in transcript folder"""
    transcript_dir = os.path.join(os.path.dirname(__file__), "transcript")
    
    # Find any JSON file in transcript directory
    json_files = glob.glob(os.path.join(transcript_dir, "*.json"))
    
    if not json_files:
        return "No transcript available."
    
    try:
        # Load the first JSON file found
        with open(json_files[0], 'r') as f:
            transcript_data = json.load(f)
        
        # Convert transcript to readable format
        transcript_text = ""
        for segment in transcript_data:
            start_time = int(segment['start'] // 60)
            start_sec = int(segment['start'] % 60)
            transcript_text += f"[{start_time:02d}:{start_sec:02d}] {segment['text']}\n"
        
        return transcript_text
    except Exception as e:
        print(f"Error loading transcript: {e}")
        return "Error loading transcript."

@app.post("/chat")
async def chat_with_gemini(chat_data: ChatMessage):
    try:
        # Load transcript context
        transcript_context = load_transcript_context()
        
        # Create the model - Updated to use the current model name
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Create context-aware prompt
        system_prompt = f"""You are an AI assistant helping users understand and analyze their video content. 

Video Transcript Context:
{transcript_context}

Based on the above transcript, please answer the user's question about their video. 
Format your response using proper markdown:
- Use **bold** for emphasis
- Use bullet points with - for lists
- Use proper paragraphs for readability
- Reference specific timestamps when relevant (e.g., "At 2:15...")

If the question relates to specific timestamps or content in the video, reference the relevant parts of the transcript.
If the question is not related to the video content, you can provide general assistance but try to relate it back to the video when possible.

User Question: {chat_data.message}"""
        
        # Generate response
        response = model.generate_content(system_prompt)
        
        return {
            "status": "success",
            "response": response.text,
            "message": chat_data.message
        }
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {
            "status": "error",
            "response": "I apologize, but I'm having trouble processing your request right now. Please try again.",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)