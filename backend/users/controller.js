const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.completeTourGuideProfile = async (req, res) => {
  const userId = req.user.id; // From authenticateToken middleware
  const { full_name, license_document_url, location, expertise } = req.body;

  if (req.user.role !== "tour_guide") {
    return res.status(403).json({
      message: "Forbidden: Only tour guides can complete this profile.",
    });
  }
  if (!full_name || !location || !expertise) {
    return res
      .status(400)
      .json({ message: "Full name, location, and expertise are required." });
  }

  try {
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle creation or update
    await db.query(
      `INSERT INTO tour_guides (user_id, full_name, license_document_url, location, expertise)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                full_name = VALUES(full_name),
                license_document_url = VALUES(license_document_url),
                location = VALUES(location),
                expertise = VALUES(expertise)`,
      [userId, full_name, license_document_url, location, expertise],
    );

    // Update user status to pending_approval
    await db.query(
      "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?",
      ["pending_approval", userId, "pending_profile"], // Only update if status was pending_profile
    );

    res.json({
      message:
        "Tour guide profile submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("Error completing tour guide profile:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
};

/**
 * Apply to become a Hotel Manager
 * F2.2: Apply to become a Hotel Manager (details, images, etc.)
 */
exports.completeHotelManagerProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, location, description, images, capacity, rate_per_night } = req.body;
  
  if (req.user.role !== "hotel_manager") {
    return res.status(403).json({
      message: "Forbidden: Only hotel managers can complete this profile."
    });
  }
  
  if (!name || !location || !rate_per_night) {
    return res.status(400).json({ 
      message: "Hotel name, location, and rate per night are required." 
    });
  }
  
  try {
    // Check if hotel already exists for this user
    const checkQuery = "SELECT id FROM hotels WHERE manager_user_id = $1";
    const checkResult = await db.query(checkQuery, [userId]);
    
    if (checkResult.rows.length > 0) {
      // Update existing hotel
      await db.query(
        `UPDATE hotels SET 
          name = $1, 
          location = $2, 
          description = $3, 
          images = $4, 
          capacity = $5, 
          rate_per_night = $6,
          updated_at = CURRENT_TIMESTAMP
         WHERE manager_user_id = $7`,
        [name, location, description, JSON.stringify(images), capacity, rate_per_night, userId]
      );
    } else {
      // Create new hotel
      await db.query(
        `INSERT INTO hotels 
          (manager_user_id, name, location, description, images, capacity, rate_per_night, created_at, updated_at)
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId, name, location, description, JSON.stringify(images), capacity, rate_per_night]
      );
    }
    
    // Update user status to pending_approval (only if initial submission)
    await db.query(
      "UPDATE users SET status = 'pending_approval', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending_profile'",
      [userId]
    );
    
    res.json({
      message: "Hotel manager profile submitted successfully. Awaiting admin approval."
    });
  } catch (error) {
    console.error("Error completing hotel manager profile:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Apply to become a Travel Agent
 * F2.3: Apply to become a Travel Agent (details, routes, etc.)
 */
exports.completeTravelAgentProfile = async (req, res) => {
  const userId = req.user.id;
  const { 
    agency_name, 
    agency_document_url, 
    contact_email, 
    contact_phone,
    initial_routes 
  } = req.body;
  
  if (req.user.role !== "travel_agent") {
    return res.status(403).json({
      message: "Forbidden: Only travel agents can complete this profile."
    });
  }
  
  if (!agency_name) {
    return res.status(400).json({ message: "Agency name is required." });
  }
  
  try {
    // Start a transaction
    await db.query('BEGIN');
    
    // Check if agency already exists for this user
    const checkQuery = "SELECT id FROM travel_agencies WHERE agent_user_id = $1";
    const checkResult = await db.query(checkQuery, [userId]);
    
    let agencyId;
    
    if (checkResult.rows.length > 0) {
      // Update existing agency
      agencyId = checkResult.rows[0].id;
      await db.query(
        `UPDATE travel_agencies SET 
          name = $1, 
          document_url = $2, 
          contact_email = $3, 
          contact_phone = $4,
          updated_at = CURRENT_TIMESTAMP
         WHERE agent_user_id = $5`,
        [agency_name, agency_document_url, contact_email, contact_phone, userId]
      );
    } else {
      // Create new agency
      const agencyResult = await db.query(
        `INSERT INTO travel_agencies 
          (agent_user_id, name, document_url, contact_email, contact_phone, created_at, updated_at)
         VALUES 
          ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [userId, agency_name, agency_document_url, contact_email, contact_phone]
      );
      
      agencyId = agencyResult.rows[0].id;
    }
    
    // Insert any provided transport routes
    if (initial_routes && Array.isArray(initial_routes) && initial_routes.length > 0) {
      for (const route of initial_routes) {
        await db.query(
          `INSERT INTO transport_routes
            (agency_id, origin, destination, transportation_type, cost, description)
           VALUES
            ($1, $2, $3, $4, $5, $6)`,
          [agencyId, route.origin, route.destination, route.type, route.cost, route.description]
        );
      }
    }
    
    // Update user status to pending_approval (only if initial submission)
    await db.query(
      "UPDATE users SET status = 'pending_approval', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending_profile'",
      [userId]
    );
    
    await db.query('COMMIT');
    
    res.json({
      message: "Travel agency profile submitted successfully. Awaiting admin approval.",
      agencyId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error completing travel agent profile:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Update user password
 * F4.1: User update authentication credentials
 */
exports.updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      message: "Current password and new password are required" 
    });
  }
  
  // Validate new password (simple validation, can be enhanced)
  if (newPassword.length < 8) {
    return res.status(400).json({ 
      message: "New password must be at least 8 characters long" 
    });
  }
  
  try {
    // Get current password hash
    const userQuery = "SELECT password_hash FROM users WHERE id = $1";
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const currentHash = userResult.rows[0].password_hash;
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, currentHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newHash, userId]
    );
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Failed to update password", error: error.message });
  }
};

/**
 * Update profile details based on user role
 * F4.2: User update profile details according to role
 */
exports.updateProfileDetails = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const profileData = req.body;
  
  // User must have an active status to update profile
  try {
    const statusQuery = "SELECT status FROM users WHERE id = $1";
    const statusResult = await db.query(statusQuery, [userId]);
    
    if (statusResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userStatus = statusResult.rows[0].status;
    
    if (userStatus !== 'active') {
      return res.status(403).json({ 
        message: "Profile updates only allowed for active accounts" 
      });
    }
    
    let updateSuccess = false;
    
    switch (userRole) {
      case 'tour_guide':
        // Get tour guide ID
        const guideQuery = "SELECT id FROM tour_guides WHERE user_id = $1";
        const guideResult = await db.query(guideQuery, [userId]);
        
        if (guideResult.rows.length === 0) {
          return res.status(404).json({ message: "Tour guide profile not found" });
        }
        
        // Update tour guide profile
        await db.query(
          `UPDATE tour_guides SET
            full_name = COALESCE($1, full_name),
            location = COALESCE($2, location),
            expertise = COALESCE($3, expertise),
            updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $4`,
          [profileData.full_name, profileData.location, profileData.expertise, userId]
        );
        
        updateSuccess = true;
        break;
        
      case 'hotel_manager':
        // Get hotel ID
        const hotelQuery = "SELECT id FROM hotels WHERE manager_user_id = $1";
        const hotelResult = await db.query(hotelQuery, [userId]);
        
        if (hotelResult.rows.length === 0) {
          return res.status(404).json({ message: "Hotel profile not found" });
        }
        
        // Update hotel profile
        await db.query(
          `UPDATE hotels SET
            name = COALESCE($1, name),
            location = COALESCE($2, location),
            description = COALESCE($3, description),
            capacity = COALESCE($4, capacity),
            rate_per_night = COALESCE($5, rate_per_night),
            updated_at = CURRENT_TIMESTAMP
           WHERE manager_user_id = $6`,
          [profileData.name, profileData.location, profileData.description, 
           profileData.capacity, profileData.rate_per_night, userId]
        );
        
        // Handle images update separately if provided
        if (profileData.images && Array.isArray(profileData.images)) {
          await db.query(
            "UPDATE hotels SET images = $1 WHERE manager_user_id = $2",
            [JSON.stringify(profileData.images), userId]
          );
        }
        
        updateSuccess = true;
        break;
        
      case 'travel_agent':
        // Get agency ID
        const agencyQuery = "SELECT id FROM travel_agencies WHERE agent_user_id = $1";
        const agencyResult = await db.query(agencyQuery, [userId]);
        
        if (agencyResult.rows.length === 0) {
          return res.status(404).json({ message: "Travel agency profile not found" });
        }
        
        // Update agency profile
        await db.query(
          `UPDATE travel_agencies SET
            name = COALESCE($1, name),
            contact_email = COALESCE($2, contact_email),
            contact_phone = COALESCE($3, contact_phone),
            updated_at = CURRENT_TIMESTAMP
           WHERE agent_user_id = $4`,
          [profileData.agency_name, profileData.contact_email, profileData.contact_phone, userId]
        );
        
        updateSuccess = true;
        break;
        
      case 'tourist':
        // Update basic user profile fields if needed
        // No specialized profile for tourists in the current design
        return res.status(200).json({ message: "No specialized profile updates for tourists" });
        
      default:
        return res.status(400).json({ message: "Invalid user role for profile update" });
    }
    
    if (updateSuccess) {
      res.status(200).json({ message: "Profile updated successfully" });
    } else {
      res.status(500).json({ message: "Failed to update profile" });
    }
  } catch (error) {
    console.error("Error updating profile details:", error);
    res.status(500).json({ message: "Failed to update profile details", error: error.message });
  }
};
