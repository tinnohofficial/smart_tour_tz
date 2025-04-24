// Parse the response body
try {
    const responseJson = pm.response.json();
    console.log("Response JSON:", responseJson);
    
    // Check if login was successful
    if (pm.response.code === 200 && responseJson.token) {
        // Get the token
        const token = responseJson.token;
        console.log("Token found:", token);
        
        // Get user info and role
        if (responseJson.user && responseJson.user.role) {
            const role = responseJson.user.role;
            console.log("User role:", role);
            
            // Update the general token variable at COLLECTION level
            pm.collectionVariables.set("token", token);
            
            // Update role-specific token based on the user role
            switch (role) {
                case "hotel_manager":
                    pm.collectionVariables.set("hotelManagerToken", token);
                    console.log("Updated hotelManagerToken");
                    break;
                case "admin":
                    pm.collectionVariables.set("adminToken", token);
                    console.log("Updated adminToken");
                    break;
                case "tourist":
                    pm.collectionVariables.set("touristToken", token);
                    console.log("Updated touristToken");
                    break;
                case "tour_guide":
                    pm.collectionVariables.set("tourGuideToken", token);
                    console.log("Updated tourGuideToken");
                    break;
                case "travel_agent":
                    pm.collectionVariables.set("travelAgentToken", token);
                    console.log("Updated travelAgentToken");
                    break;
                default:
                    console.log("Unknown role:", role);
            }
        } else {
            console.log("User object or role not found in response");
        }
    } else {
        console.log("Token not found in response");
    }
} catch (e) {
    console.error("Error parsing response:", e);
}