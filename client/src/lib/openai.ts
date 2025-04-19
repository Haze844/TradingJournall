import { apiRequest } from "./queryClient";

// Function to get OpenAI feedback for a trade
export async function getOpenAIFeedback(trade: any): Promise<string> {
  try {
    // In a real application with direct OpenAI integration, we would call the API here
    // For this implementation, we're using server-side generation
    
    // This function is mainly a placeholder, as the feedback is generated
    // on the server side when creating a trade
    
    // If we need to manually request feedback for an existing trade:
    const response = await apiRequest("POST", "/api/generate-feedback", trade);
    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error("Error getting OpenAI feedback:", error);
    return "Unable to generate feedback at this time.";
  }
}
