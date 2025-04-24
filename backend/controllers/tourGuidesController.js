const db = require("../config/db");

exports.submitTourGuideProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, license_document_url, location, expertise, activity_expertise } = req.body;

  if (!full_name || !location || !expertise) {
    return res
      .status(400)
      .json({ message: "Full name, location, and expertise are required." });
  }

  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      await connection.query(
        `INSERT INTO tour_guides (user_id, full_name, license_document_url, location, expertise)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         license_document_url = VALUES(license_document_url),
         location = VALUES(location),
         expertise = VALUES(expertise)`,
        [userId, full_name, license_document_url, location, expertise],
      );
      
      // If activity expertise is provided, validate them
      if (activity_expertise && Array.isArray(activity_expertise) && activity_expertise.length > 0) {
        // Check if the activities exist (and are in the specified location)
        const placeholders = activity_expertise.map(() => "?").join(",");
        const [activityRows] = await connection.query(
          `SELECT id, name FROM activities WHERE id IN (${placeholders})`,
          activity_expertise
        );
        
        if (activityRows.length !== activity_expertise.length) {
          throw new Error("One or more selected activities do not exist");
        }
        
        // Store the activity expertise information as JSON in the expertise field
        // This assumes expertise is already a text field that can store this information
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
          "UPDATE users SET status = 'pending_approval', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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
    res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};

/**
 * Get tour guide profile details
 */
exports.getGuideProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM tour_guides WHERE user_id = ?",
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

    // Get user data as well
    const [userRows] = await db.query(
      "SELECT email, phone_number, status FROM users WHERE id = ?",
      [userId],
    );

    const responseData = {
      ...guide,
      email: userRows[0].email,
      phone_number: userRows[0].phone_number,
      status: userRows[0].status,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching tour guide profile:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

/**
 * Update tour guide profile
 */
exports.updateGuideProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, location, expertise, activity_expertise } = req.body;

  try {
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

      if (location !== undefined) {
        updates.push("location = ?");
        params.push(location);
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
