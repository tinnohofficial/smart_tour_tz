const db = require("../config/db");

/**
 * Create a tour guide profile
 */
exports.createTourGuide = async (req, res) => {
  const userId = req.user.id;
  const { full_name, license_document_url, destination_id, expertise, activity_expertise } = req.body;

  console.log("Tour guide profile submission:", {
    userId,
    body: req.body,
    userRole: req.user.role,
    userStatus: req.user.status
  });

  if (!full_name || !destination_id || !expertise) {
    return res
      .status(400)
      .json({ message: "Full name, destination_id, and expertise are required." });
  }

  try {
    // Check if user exists and get their current status
    const [userRows] = await db.query(
      "SELECT id, role, status FROM users WHERE id = ? AND role = 'tour_guide'",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ 
        message: "Tour guide user not found. Please check your account." 
      });
    }

    // Verify destination exists
    const [destinationRows] = await db.query(
      "SELECT id, name FROM destinations WHERE id = ?",
      [destination_id]
    );

    if (destinationRows.length === 0) {
      return res.status(400).json({ 
        message: "Invalid destination selected." 
      });
    }

    // Check if tour guide profile already exists
    const [existingGuide] = await db.query(
      "SELECT user_id FROM tour_guides WHERE user_id = ?",
      [userId]
    );

    if (existingGuide.length > 0) {
      return res.status(400).json({ 
        message: "Tour guide profile already exists. Use update instead." 
      });
    }
    
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      await connection.query(
        `INSERT INTO tour_guides (user_id, full_name, license_document_url, destination_id, expertise)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         license_document_url = VALUES(license_document_url),
         destination_id = VALUES(destination_id),
         expertise = VALUES(expertise)`,
        [userId, full_name, license_document_url, destination_id, expertise],
      );
      
      // If activity expertise is provided, validate them
      if (activity_expertise && Array.isArray(activity_expertise) && activity_expertise.length > 0) {
        // Check if the activities exist
        const placeholders = activity_expertise.map(() => "?").join(",");
        const [activityRows] = await connection.query(
          `SELECT id, name FROM activities WHERE id IN (${placeholders})`,
          activity_expertise
        );
        
        if (activityRows.length !== activity_expertise.length) {
          throw new Error("One or more selected activities do not exist");
        }
        
        // Store the activity expertise information as JSON in the expertise field
        const expertiseData = {
          general: expertise,
          activities: activityRows.map(a => ({ id: a.id, name: a.name }))
        };
        
        await connection.query(
          `UPDATE tour_guides SET expertise = ? WHERE user_id = ?`,
          [JSON.stringify(expertiseData), userId]
        );
      }

      // Update user status to pending_approval if initial submission
      const [userResult] = await connection.query(
        "SELECT status FROM users WHERE id = ?",
        [userId],
      );

      if (userResult[0].status === "pending_profile") {
        await connection.query(
          "UPDATE users SET status = 'pending_approval' WHERE id = ?",
          [userId],
        );
      }
      
      await connection.commit();
      
      res.json({
        message:
          "Tour guide profile submitted successfully. Awaiting admin approval.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error completing tour guide profile:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};

/**
 * Get tour guide profile details by ID
 */
exports.getTourGuide = async (req, res) => {
  const guideId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT tg.*, u.status, d.name as destination_name, d.region as destination_region,
              d.name as location
       FROM tour_guides tg 
       JOIN users u ON tg.user_id = u.id 
       JOIN destinations d ON tg.destination_id = d.id
       WHERE tg.user_id = ?`,
      [guideId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tour guide profile not found" });
    }

    const guide = { ...rows[0] };
    
    // Parse expertise JSON if it exists
    if (guide.expertise) {
      try {
        guide.expertise = JSON.parse(guide.expertise);
      } catch (e) {
        // If not valid JSON, keep as is
        console.log("Could not parse guide expertise JSON:", e);
      }
    }

    res.status(200).json(guide);
  } catch (error) {
    console.error("Error fetching tour guide profile:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

/**
 * Update tour guide profile (including availability)
 */
exports.updateGuideProfile = async (req, res) => {
  const guideId = req.params.id;
  const userId = req.user.id;

  // Authorization check: ensure the tour guide can only update their own profile
  if (guideId !== userId.toString()) {
    return res.status(403).json({ 
      message: "Access denied. You can only update your own profile." 
    });
  }

  const { full_name, destination_id, expertise, activity_expertise, available } = req.body;

  try {
    // Verify the user exists first
    const [userRows] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found. Cannot update tour guide profile." });
    }

    // Verify destination exists if provided
    if (destination_id !== undefined) {
      const [destinationRows] = await db.query(
        "SELECT id, name FROM destinations WHERE id = ?",
        [destination_id]
      );

      if (destinationRows.length === 0) {
        return res.status(400).json({ 
          message: "Invalid destination selected." 
        });
      }
    }
    
    // Check if profile exists
    const [guideRows] = await db.query(
      "SELECT expertise FROM tour_guides WHERE user_id = ?",
      [guideId],
    );

    if (guideRows.length === 0) {
      return res.status(404).json({ message: "Tour guide profile not found" });
    }

    // Start a transaction for potential changes
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update the fields that are provided
      const updates = [];
      const params = [];

      if (full_name !== undefined) {
        updates.push("full_name = ?");
        params.push(full_name);
      }

      if (destination_id !== undefined) {
        updates.push("destination_id = ?");
        params.push(destination_id);
      }

      if (available !== undefined) {
        updates.push("available = ?");
        params.push(available);
      }

      // Handle expertise fields properly
      if (expertise !== undefined || activity_expertise !== undefined) {
        // Get current expertise
        let currentExpertise = {};
        try {
          if (guideRows[0].expertise) {
            currentExpertise = JSON.parse(guideRows[0].expertise);
          }
        } catch (e) {
          // If not valid JSON, treat as string
          currentExpertise = { general: guideRows[0].expertise };
        }

        // Update general expertise if provided
        if (expertise !== undefined) {
          currentExpertise.general = expertise;
        }

        // Update activity expertise if provided
        if (activity_expertise && Array.isArray(activity_expertise) && activity_expertise.length > 0) {
          // Check if the activities exist
          const placeholders = activity_expertise.map(() => "?").join(",");
          const [activityRows] = await connection.query(
            `SELECT id, name FROM activities WHERE id IN (${placeholders})`,
            activity_expertise
          );
          
          if (activityRows.length !== activity_expertise.length) {
            throw new Error("One or more selected activities do not exist");
          }
          
          currentExpertise.activities = activityRows.map(a => ({ id: a.id, name: a.name }));
        }

        updates.push("expertise = ?");
        params.push(JSON.stringify(currentExpertise));
      }

      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ message: "No fields to update" });
      }

      // Add guide_id to params for WHERE clause
      params.push(guideId);

      await connection.query(
        `UPDATE tour_guides SET ${updates.join(", ")} WHERE user_id = ?`,
        params,
      );

      await connection.commit();
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating tour guide profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Get all tour guides for admin
 */
exports.getAllTourGuides = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT tg.*, u.email, u.status, d.name as destination_name, d.region as destination_region,
              d.name as location
       FROM tour_guides tg 
       JOIN users u ON tg.user_id = u.id 
       JOIN destinations d ON tg.destination_id = d.id
       ORDER BY tg.updated_at DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching tour guides:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch tour guides", error: error.message });
  }
};

/**
 * Get all approved and available tour guides for public listing
 */
exports.getAvailableTourGuides = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT tg.user_id, tg.full_name, tg.expertise, tg.available, 
              d.name as destination_name, d.region as destination_region,
              d.name as location
       FROM tour_guides tg 
       JOIN users u ON tg.user_id = u.id 
       JOIN destinations d ON tg.destination_id = d.id
       WHERE u.status = 'active' AND tg.available = 1
       ORDER BY tg.full_name ASC`
    );

    // Parse expertise JSON for each guide
    const guides = rows.map(guide => {
      if (guide.expertise) {
        try {
          guide.expertise = JSON.parse(guide.expertise);
        } catch (e) {
          // If not valid JSON, keep as is
          console.log("Could not parse guide expertise JSON:", e);
        }
      }
      return guide;
    });

    res.status(200).json(guides);
  } catch (error) {
    console.error("Error fetching available tour guides:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch available tour guides", error: error.message });
  }
};

exports.getManagerProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT tg.*, u.status, d.name as destination_name, d.region as destination_region,
              d.name as location
       FROM tour_guides tg 
       JOIN users u ON tg.user_id = u.id 
       JOIN destinations d ON tg.destination_id = d.id
       WHERE tg.user_id = ?`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tour guide profile not found" });
    }

    const guide = { ...rows[0] };
    
    // Parse expertise JSON if it exists
    if (guide.expertise) {
      try {
        guide.expertise = JSON.parse(guide.expertise);
      } catch (e) {
        // If not valid JSON, keep as is
        console.log("Could not parse guide expertise JSON:", e);
      }
    }

    res.status(200).json(guide);
  } catch (error) {
    console.error("Error fetching tour guide manager profile:", error);
    res.status(500).json({ message: "Failed to fetch tour guide profile", error: error.message });
  }
};

exports.updateManagerProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, destination_id, expertise, activity_expertise, available } = req.body;

  try {
    // Verify the user exists first
    const [userRows] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found. Cannot update tour guide profile." });
    }

    // Verify destination exists if provided
    if (destination_id !== undefined) {
      const [destinationRows] = await db.query(
        "SELECT id, name FROM destinations WHERE id = ?",
        [destination_id]
      );

      if (destinationRows.length === 0) {
        return res.status(400).json({ 
          message: "Invalid destination selected." 
        });
      }
    }
    
    // Check if profile exists
    const [guideRows] = await db.query(
      "SELECT expertise FROM tour_guides WHERE user_id = ?",
      [userId],
    );

    if (guideRows.length === 0) {
      return res.status(404).json({ message: "Tour guide profile not found" });
    }

    // Start a transaction for potential changes
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update the fields that are provided
      const updates = [];
      const params = [];

      if (full_name !== undefined) {
        updates.push("full_name = ?");
        params.push(full_name);
      }

      if (destination_id !== undefined) {
        updates.push("destination_id = ?");
        params.push(destination_id);
      }

      if (available !== undefined) {
        updates.push("available = ?");
        params.push(available);
      }

      // Handle expertise fields properly
      if (expertise !== undefined || activity_expertise !== undefined) {
        // Get current expertise
        let currentExpertise = {};
        try {
          if (guideRows[0].expertise) {
            currentExpertise = JSON.parse(guideRows[0].expertise);
          }
        } catch (e) {
          // If not valid JSON, treat as string
          currentExpertise = { general: guideRows[0].expertise };
        }

        // Update general expertise if provided
        if (expertise !== undefined) {
          currentExpertise.general = expertise;
        }

        // Update activity expertise if provided
        if (activity_expertise && Array.isArray(activity_expertise) && activity_expertise.length > 0) {
          // Check if the activities exist
          const placeholders = activity_expertise.map(() => "?").join(",");
          const [activityRows] = await connection.query(
            `SELECT id, name FROM activities WHERE id IN (${placeholders})`,
            activity_expertise
          );
          
          if (activityRows.length !== activity_expertise.length) {
            throw new Error("One or more selected activities do not exist");
          }
          
          currentExpertise.activities = activityRows.map(a => ({ id: a.id, name: a.name }));
        }

        updates.push("expertise = ?");
        params.push(JSON.stringify(currentExpertise));
      }

      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ message: "No fields to update" });
      }

      // Add user_id to params for WHERE clause
      params.push(userId);

      await connection.query(
        `UPDATE tour_guides SET ${updates.join(", ")} WHERE user_id = ?`,
        params,
      );

      await connection.commit();
      res.status(200).json({ message: "Tour guide profile updated successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating tour guide manager profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update tour guide profile", error: error.message });
  }
};


