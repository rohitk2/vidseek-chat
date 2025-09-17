import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Tuple
import re
import glob

class VideoSegment(BaseModel):
    start: float = Field(description="Start time of the segment")
    end: float = Field(description="End time of the segment")
    relevance_score: float = Field(description="Relevance score from 0-10")
    explanation: str = Field(description="Why this segment is relevant")

class BestSegments(BaseModel):
    segments: List[VideoSegment] = Field(description="List of the 3 best video segments")

def find_best_segments(user_query):
    # Load environment variables
    load_dotenv()
    
    # Get Gemini API key
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    # Initialize Gemini LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=gemini_api_key,
        temperature=0.3
    )
    
    # Find transcript JSON file dynamically
    transcript_dir = os.path.join(os.path.dirname(__file__), 'transcript')
    transcript_files = glob.glob(os.path.join(transcript_dir, '*.json'))
    
    if not transcript_files:
        raise FileNotFoundError(f"No transcript JSON files found in {transcript_dir}")
    
    # Use the first (or most recent) transcript file found
    transcript_path = transcript_files[0]  # You could also sort by modification time if needed
    
    try:
        with open(transcript_path, 'r') as f:
            transcript_data = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Transcript file not found at {transcript_path}")
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON format in transcript file")
    
    # Create output parser
    parser = PydanticOutputParser(pydantic_object=BestSegments)
    
    # Create prompt template
    prompt_template = PromptTemplate(
        input_variables=["user_query", "transcript_data", "format_instructions"],
        template="""You are an expert video content analyzer. Your task is to find the 3 most relevant video segments based on the user's query.

User Query: {user_query}

Video Transcript Data:
{transcript_data}

Analyze the transcript and identify the 3 segments that best match the user's query. For each segment, provide:
1. The exact start and end times from the transcript
2. A relevance score from 0-10 (10 being most relevant)
3. A clear explanation of why this segment is relevant to the query

Focus on segments that directly address or relate to the user's query content.

{format_instructions}
"""
    )
    
    # Format the prompt
    formatted_prompt = prompt_template.format(
        user_query=user_query,
        transcript_data=json.dumps(transcript_data, indent=2),
        format_instructions=parser.get_format_instructions()
    )
    
    try:
        # Get response from LLM
        response = llm.invoke([HumanMessage(content=formatted_prompt)])
        
        # Print the raw response
        print("LangChain LLM Response:")
        print(response.content)
        print("\n" + "="*50 + "\n")
        
        # Parse the structured response
        try:
            parsed_result = parser.parse(response.content)
            segments_tuples = [(seg.start, seg.end) for seg in parsed_result.segments]
            
            # Format the final output using LLM formatter
            formatted_output = format_segments_with_llm(llm, segments_tuples, parsed_result.segments, user_query)
            print(formatted_output)
            
            # Return dictionary format instead of tuples
            return [{
                "start": seg.start,
                "end": seg.end,
                "relevance_score": seg.relevance_score,
                "explanation": seg.explanation
            } for seg in parsed_result.segments]
            
        except Exception as parse_error:
            print(f"Parsing error: {parse_error}")
            # Fallback: extract segments manually
            return extract_segments_fallback(response.content, transcript_data)
            
    except Exception as e:
        raise Exception(f"Error generating response from LangChain: {str(e)}")

def format_segments_with_llm(llm, segments_tuples, segment_objects, user_query):
    """Use LLM to format the final output in a nice readable format"""
    
    formatter_prompt = f"""Format the following video segment results in a clear, professional summary:

User Query: "{user_query}"

Selected Segments:
{chr(10).join([f"Segment {i+1}: {seg.start}s - {seg.end}s (Score: {seg.relevance_score}/10) - {seg.explanation}" for i, seg in enumerate(segment_objects)])}

Time Ranges: {segments_tuples}

Create a concise, well-formatted summary that explains:
1. What the user was looking for
2. The 3 selected time ranges
3. Why these segments were chosen

Keep it professional and informative."""
    
    try:
        format_response = llm.invoke([HumanMessage(content=formatter_prompt)])
        return f"\nFormatted Summary:\n{format_response.content}\n"
    except:
        return f"\nSegments found: {segments_tuples}\n"

def extract_segments_fallback(response_text, transcript_data):
    """Fallback method to extract segments if parsing fails"""
    segments = []
    
    # Try to find time ranges in the response
    time_patterns = [
        r'"start":\s*(\d+\.\d+).*?"end":\s*(\d+\.\d+)',
        r'(\d+\.\d+)\s*-\s*(\d+\.\d+)',
        r'(\d+\.\d+)\s*to\s*(\d+\.\d+)'
    ]
    
    for pattern in time_patterns:
        matches = re.findall(pattern, response_text, re.DOTALL)
        for match in matches:
            try:
                start_time = float(match[0])
                end_time = float(match[1])
                # Return dictionary format instead of tuple
                segments.append({
                    "start": start_time,
                    "end": end_time,
                    "relevance_score": 7.0,  # Default score
                    "explanation": "Segment extracted from fallback parsing"
                })
                if len(segments) >= 3:
                    break
            except ValueError:
                continue
        if len(segments) >= 3:
            break
    
    # If still not enough, use first 3 from transcript
    while len(segments) < 3 and len(segments) < len(transcript_data):
        segment = transcript_data[len(segments)]
        # Return dictionary format instead of tuple
        segments.append({
            "start": segment['start'],
            "end": segment['end'],
            "relevance_score": 5.0,  # Default score
            "explanation": "Default segment from transcript"
        })
    
    return segments[:3]

# Example usage:
if __name__ == "__main__":
    result = find_best_segments("Tell me about Claude 3 Opus features")
    print(f"\nFinal Result - Best 3 segments: {result}")