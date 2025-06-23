// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const db = require("../config/db");

// // Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Get tour suggestions based on user preferences
// const getTourSuggestions = async (req, res) => {
//   try {
//     const {
//       budget,
//       duration,
//       interests,
//       groupSize,
//       travelStyle,
//       accommodation,
//       season,
//       specialRequirements
//     } = req.body;

//     // Validate required fields
//     if (!budget || !duration || !interests || !Array.isArray(interests)) {
//       return res.status(400).json({
//         message: "Missing required fields: budget, duration, and interests are required"
//       });
//     }

//     // Validate Gemini API key
//     if (!process.env.GEMINI_API_KEY) {
//       console.error("GEMINI_API_KEY is not configured");
//       return res.status(500).json({
//         message: "AI service is not properly configured"
//       });
//     }    // Fetch all destinations with their activities and details
//     const destinationsQuery = `
//       SELECT 
//         d.id,
//         d.name,
//         d.description,
//         d.image_url,
//         GROUP_CONCAT(DISTINCT a.name) as activities,
//         GROUP_CONCAT(DISTINCT a.description) as activity_descriptions
//       FROM destinations d
//       LEFT JOIN activities a ON d.id = a.destination_id
//       GROUP BY d.id, d.name, d.description, d.image_url
//     `;

//     const [destinations] = await db.execute(destinationsQuery);

//     // Handle case when no destinations are available
//     if (!destinations || destinations.length === 0) {
//       return res.status(200).json({
//         message: "No destinations available at the moment",
//         suggestions: {
//           recommendations: [],
//           generalAdvice: "We apologize, but there are currently no destinations available in our system. Please check back later or contact our support team for assistance.",
//           budgetTips: "While we set up more destinations, consider planning your budget and researching Tanzania's amazing attractions online.",
//           noDestinationsAvailable: true
//         },
//         userPreferences: {
//           budget,
//           duration,
//           interests,
//           groupSize,
//           travelStyle,
//           accommodation,
//           season,
//           specialRequirements
//         }
//       });
//     }    // Create a detailed prompt for Gemini AI
//     const prompt = `
// You are a professional Tanzania tour guide AI assistant specializing in Smart Tour Tanzania. Based on the following user preferences, suggest the most suitable tours from the available destinations.

// IMPORTANT: Only recommend destinations that are explicitly listed in the "Available Destinations" section below. Do not suggest any destinations that are not in this list.

// User Preferences:
// - Budget: ${budget} (in Tanzanian Shillings)
// - Duration: ${duration} days
// - Interests: ${interests.join(', ')}
// - Group Size: ${groupSize || 'Not specified'}
// - Travel Style: ${travelStyle || 'Not specified'}
// - Accommodation: ${accommodation || 'Not specified'}
// - Preferred Season: ${season || 'Not specified'}
// - Special Requirements: ${specialRequirements || 'None'}

// Available Destinations:
// ${destinations.map(dest => `
// - ${dest.name} (ID: ${dest.id})
//   Description: ${dest.description}
//   Available Activities: ${dest.activities || 'None listed'}
//   Activity Details: ${dest.activity_descriptions || 'None listed'}
// `).join('')}

// Please provide recommendations in the following JSON format ONLY (no additional text):
// {
//   "recommendations": [
//     {
//       "destinationId": number,
//       "destinationName": "string",
//       "matchScore": number (0-100),
//       "reasons": ["reason1", "reason2", "reason3"],
//       "suggestedActivities": ["activity1", "activity2"],
//       "estimatedCost": "cost range in TZS",
//       "bestTravelTime": "recommended months",
//       "itinerarySuggestion": "brief itinerary suggestion"
//     }
//   ],
//   "generalAdvice": "general travel advice based on preferences",
//   "budgetTips": "specific budget optimization tips"
// }

// Important: 
// - Only recommend destinations from the provided list with their exact IDs
// - Match recommendations to user interests and budget
// - Consider Tanzania-specific factors like weather patterns
// - Provide practical advice
// - Keep recommendations between 2-4 destinations maximum
// - Ensure JSON format is valid
// - Do not create fictional destinations or activities not in the available list
// `;

//     // Get AI suggestions from Gemini
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     let aiResponse = response.text();

//     // Clean up the response to extract JSON
//     aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

//     let suggestions;
//     try {
//       suggestions = JSON.parse(aiResponse);
//     } catch (parseError) {
//       console.error("Error parsing AI response:", parseError);
//       console.error("AI Response:", aiResponse);        // Fallback response if AI response is not valid JSON
//       suggestions = {
//         recommendations: destinations.slice(0, 3).map(dest => ({
//           destinationId: dest.id,
//           destinationName: dest.name,
//           matchScore: 75,
//           reasons: ["Popular destination", "Great activities", "Good value for money"],
//           suggestedActivities: dest.activities ? dest.activities.split(',').slice(0, 3) : [],
//           estimatedCost: "Contact for pricing",
//           bestTravelTime: "Year-round",
//           itinerarySuggestion: `Explore ${dest.name} with ${duration} days to experience ${dest.description}`
//         })),
//         generalAdvice: "Tanzania offers incredible wildlife and cultural experiences. Plan according to your interests and budget.",
//         budgetTips: "Book in advance and consider group tours for better rates."
//       };
//     }

//     // Enhance suggestions with additional destination data
//     const enhancedRecommendations = suggestions.recommendations.map(rec => {
//       const destination = destinations.find(d => d.id === rec.destinationId);
//       return {
//         ...rec,        destination: destination ? {
//           id: destination.id,
//           name: destination.name,
//           description: destination.description,
//           imageUrl: destination.image_url
//         } : null
//       };
//     });

//     res.status(200).json({
//       message: "Tour suggestions generated successfully",
//       suggestions: {
//         ...suggestions,
//         recommendations: enhancedRecommendations
//       },
//       userPreferences: {
//         budget,
//         duration,
//         interests,
//         groupSize,
//         travelStyle,
//         accommodation,
//         season,
//         specialRequirements
//       }
//     });
//   } catch (error) {
//     console.error("Error generating tour suggestions:", error);
//     console.error("Error details:", {
//       message: error.message,
//       stack: error.stack,
//       preferences: { budget, duration, interests, groupSize, travelStyle, accommodation, season }
//     });
//     res.status(500).json({
//       message: "Failed to generate tour suggestions",
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   getTourSuggestions
// };
