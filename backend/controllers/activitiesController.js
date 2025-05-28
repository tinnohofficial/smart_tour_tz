const db = require("../config/db");

exports.getActivities = async (req, res) => {
  const { destinationId } = req.query;

  try {
    let query = "SELECT * FROM activities";
    let params = [];

    if (destinationId) {
      query += " WHERE destination_id = ?";
      params.push(destinationId);
    }

    const [activities] = await db.query(query, params);
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

exports.getActivityById = async (req, res) => {
  const { activityId } = req.params;

  try {
    const [activities] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [activityId]
    );

    if (activities.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.status(200).json(activities[0]);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch activity", error: error.message });
  }
};

exports.createActivity = async (req, res) => {
  const {
    name,
    description,
    destination_id,
    price,
    time_slots,
    available_dates,
    duration_hours,
    max_participants,
    difficulty_level,
    requirements
  } = req.body;

  // Validate required fields
  if (!name || !description || !destination_id || !price) {
    return res.status(400).json({
      message:
        "Required fields missing: name, description, destination_id, price are required",
    });
  }

  // Validate price is positive
  if (price <= 0) {
    return res.status(400).json({
      message: "Price must be greater than zero"
    });
  }

  // Validate time slots format if provided
  let timeSlots = null;
  if (time_slots) {
    try {
      timeSlots = typeof time_slots === 'string' ? JSON.parse(time_slots) : time_slots;
      if (!Array.isArray(timeSlots)) {
        return res.status(400).json({
          message: "Time slots must be an array of objects with time and available_spots properties"
        });
      }
      
      // Validate each time slot
      for (const slot of timeSlots) {
        if (!slot.time || typeof slot.available_spots !== 'number') {
          return res.status(400).json({
            message: "Each time slot must have 'time' (string) and 'available_spots' (number) properties"
          });
        }
      }
    } catch (e) {
      return res.status(400).json({
        message: "Invalid time_slots format. Must be valid JSON array."
      });
    }
  }

  // Validate available dates format if provided
  let availableDates = null;
  if (available_dates) {
    try {
      availableDates = typeof available_dates === 'string' ? JSON.parse(available_dates) : available_dates;
      if (!Array.isArray(availableDates)) {
        return res.status(400).json({
          message: "Available dates must be an array of date strings"
        });
      }
      
      // Validate date format
      for (const date of availableDates) {
        if (isNaN(Date.parse(date))) {
          return res.status(400).json({
            message: `Invalid date format: ${date}. Use YYYY-MM-DD format.`
          });
        }
      }
    } catch (e) {
      return res.status(400).json({
        message: "Invalid available_dates format. Must be valid JSON array."
      });
    }
  }

  try {
    // Verify the destination exists
    const [destinationRows] = await db.query(
      "SELECT id FROM destinations WHERE id = ?",
      [destination_id],
    );

    if (destinationRows.length === 0) {
      return res.status(404).json({ message: "Destination not found" });
    }

    // Create the activity with enhanced scheduling fields
    const [result] = await db.query(
      `INSERT INTO activities (
        name,
        description,
        destination_id,
        price,
        time_slots,
        available_dates,
        duration_hours,
        max_participants,
        difficulty_level,
        requirements
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        destination_id,
        price,
        timeSlots ? JSON.stringify(timeSlots) : null,
        availableDates ? JSON.stringify(availableDates) : null,
        duration_hours || null,
        max_participants || null,
        difficulty_level || 'beginner',
        requirements || null
      ],
    );

    res.status(201).json({
      message: "Activity created successfully",
      id: result.insertId,
      name,
      destination_id,
      time_slots: timeSlots,
      available_dates: availableDates,
      duration_hours,
      max_participants,
      difficulty_level,
      requirements
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({
      message: "Failed to create activity",
      error: error.message,
    });
  }
};

exports.updateActivity = async (req, res) => {
  const { activityId } = req.params;
  const updateData = req.body;

  try {
    // First check if the activity exists
    const [activityRows] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [activityId]
    );

    if (activityRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      "name",
      "description",
      "destination_id", 
      "price",
      "time_slots",
      "available_dates",
      "duration_hours",
      "max_participants",
      "difficulty_level",
      "requirements"
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (field in updateData) {
        // Handle JSON fields specially
        if (field === 'time_slots' || field === 'available_dates') {
          let jsonValue = updateData[field];
          
          if (jsonValue !== null && jsonValue !== undefined) {
            try {
              // Parse if string, validate if array
              if (typeof jsonValue === 'string') {
                jsonValue = JSON.parse(jsonValue);
              }
              
              if (field === 'time_slots') {
                if (!Array.isArray(jsonValue)) {
                  return res.status(400).json({
                    message: "Time slots must be an array of objects"
                  });
                }
                // Validate time slot structure
                for (const slot of jsonValue) {
                  if (!slot.time || typeof slot.available_spots !== 'number') {
                    return res.status(400).json({
                      message: "Each time slot must have 'time' and 'available_spots' properties"
                    });
                  }
                }
              }
              
              if (field === 'available_dates') {
                if (!Array.isArray(jsonValue)) {
                  return res.status(400).json({
                    message: "Available dates must be an array of date strings"
                  });
                }
                // Validate date format
                for (const date of jsonValue) {
                  if (isNaN(Date.parse(date))) {
                    return res.status(400).json({
                      message: `Invalid date format: ${date}. Use YYYY-MM-DD format.`
                    });
                  }
                }
              }
              
              updates.push(`${field} = ?`);
              values.push(JSON.stringify(jsonValue));
            } catch (e) {
              return res.status(400).json({
                message: `Invalid ${field} format. Must be valid JSON.`
              });
            }
          } else {
            // Handle null values
            updates.push(`${field} = ?`);
            values.push(null);
          }
        } else {
          // Handle regular fields
          if (field === 'price' && updateData[field] <= 0) {
            return res.status(400).json({
              message: "Price must be greater than zero"
            });
          }
          
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Add activityId as the last value
    values.push(activityId);

    // Execute update query
    await db.query(
      `UPDATE activities SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.status(200).json({ 
      message: "Activity updated successfully",
      activityId: activityId
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({
      message: "Failed to update activity",
      error: error.message,
    });
  }
};

exports.deleteActivity = async (req, res) => {
  const { activityId } = req.params;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First check if the activity exists
      const [activityRows] = await connection.query(
        "SELECT * FROM activities WHERE id = ?",
        [activityId],
      );

      if (activityRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          message: "Activity not found"
        });
      }

      // Check if this activity is part of any bookings
      const [bookingItems] = await connection.query(
        `SELECT bi.id, b.status 
         FROM booking_items bi 
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.item_type = 'activity' AND bi.id = ?`,
        [activityId]
      );

      // If activity is in active bookings, don't allow deletion
      const activeBookings = bookingItems.filter(
        item => item.status !== 'cancelled' && item.status !== 'completed'
      );

      if (activeBookings.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Cannot delete activity that is part of active bookings",
          activeBookingsCount: activeBookings.length
        });
      }

      // Delete the activity since we don't have status field anymore
      await connection.query(
        "DELETE FROM activities WHERE id = ?", 
        [activityId]
      );

      await connection.commit();
      connection.release();
      res.status(200).json({ 
        message: "Activity deleted successfully" 
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      message: "Failed to delete activity",
      error: error.message,
    });
  }
};

/**
 * Get activity availability for specific dates and time slots
 */
exports.getActivityAvailability = async (req, res) => {
  const { activityId } = req.params;
  const { date, time_slot } = req.query;

  try {
    // Get activity details including time slots and available dates
    const [activityRows] = await db.query(
      "SELECT time_slots, available_dates, max_participants FROM activities WHERE id = ?",
      [activityId]
    );

    if (activityRows.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const activity = activityRows[0];
    let timeSlots = [];
    let availableDates = [];

    try {
      timeSlots = activity.time_slots ? JSON.parse(activity.time_slots) : [];
      availableDates = activity.available_dates ? JSON.parse(activity.available_dates) : [];
    } catch (e) {
      console.error('Failed to parse activity scheduling data:', e);
      timeSlots = [];
      availableDates = [];
    }

    // If specific date and time_slot are provided, check availability
    if (date && time_slot) {
      // Check if date is available
      if (availableDates.length > 0 && !availableDates.includes(date)) {
        return res.status(400).json({
          message: "Activity is not available on the specified date",
          available: false
        });
      }

      // Check if time slot exists
      const timeSlotInfo = timeSlots.find(slot => slot.time === time_slot);
      if (timeSlots.length > 0 && !timeSlotInfo) {
        return res.status(400).json({
          message: "Time slot not available for this activity",
          available: false
        });
      }

      // Check current bookings for this date and time slot
      const [bookingCount] = await db.query(
        `SELECT COUNT(*) as booked_spots
         FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.item_type = 'activity' 
         AND bi.id = ? 
         AND b.status != 'cancelled'
         AND JSON_EXTRACT(bi.activity_schedule, '$.date') = ?
         AND JSON_EXTRACT(bi.activity_schedule, '$.time_slot') = ?`,
        [activityId, date, time_slot]
      );

      const bookedSpots = bookingCount[0].booked_spots || 0;
      const availableSpots = timeSlotInfo ? timeSlotInfo.available_spots - bookedSpots : (activity.max_participants || 999) - bookedSpots;

      return res.status(200).json({
        available: availableSpots > 0,
        available_spots: Math.max(0, availableSpots),
        booked_spots: bookedSpots,
        total_spots: timeSlotInfo ? timeSlotInfo.available_spots : activity.max_participants,
        date: date,
        time_slot: time_slot
      });
    }

    // Return general availability information
    const availability = [];
    
    if (availableDates.length === 0) {
      // If no specific dates, activity is generally available
      if (timeSlots.length === 0) {
        return res.status(200).json({
          message: "Activity is available anytime",
          flexible_scheduling: true,
          time_slots: [],
          available_dates: []
        });
      } else {
        // Show time slots for any date
        return res.status(200).json({
          flexible_scheduling: false,
          time_slots: timeSlots,
          available_dates: []
        });
      }
    }

    // Calculate availability for each date and time slot combination
    for (const availableDate of availableDates) {
      if (timeSlots.length === 0) {
        // No specific time slots, just check date availability
        const [dayBookings] = await db.query(
          `SELECT COUNT(*) as booked_spots
           FROM booking_items bi
           JOIN bookings b ON bi.booking_id = b.id
           WHERE bi.item_type = 'activity' 
           AND bi.id = ? 
           AND b.status != 'cancelled'
           AND JSON_EXTRACT(bi.activity_schedule, '$.date') = ?`,
          [activityId, availableDate]
        );

        const bookedSpots = dayBookings[0].booked_spots || 0;
        const availableSpots = (activity.max_participants || 999) - bookedSpots;

        availability.push({
          date: availableDate,
          time_slot: null,
          available: availableSpots > 0,
          available_spots: Math.max(0, availableSpots),
          booked_spots: bookedSpots
        });
      } else {
        // Check each time slot for this date
        for (const timeSlot of timeSlots) {
          const [slotBookings] = await db.query(
            `SELECT COUNT(*) as booked_spots
             FROM booking_items bi
             JOIN bookings b ON bi.booking_id = b.id
             WHERE bi.item_type = 'activity' 
             AND bi.id = ? 
             AND b.status != 'cancelled'
             AND JSON_EXTRACT(bi.activity_schedule, '$.date') = ?
             AND JSON_EXTRACT(bi.activity_schedule, '$.time_slot') = ?`,
            [activityId, availableDate, timeSlot.time]
          );

          const bookedSpots = slotBookings[0].booked_spots || 0;
          const availableSpots = timeSlot.available_spots - bookedSpots;

          availability.push({
            date: availableDate,
            time_slot: timeSlot.time,
            available: availableSpots > 0,
            available_spots: Math.max(0, availableSpots),
            booked_spots: bookedSpots,
            total_spots: timeSlot.available_spots
          });
        }
      }
    }

    res.status(200).json({
      activity_id: activityId,
      flexible_scheduling: false,
      time_slots: timeSlots,
      available_dates: availableDates,
      availability: availability
    });

  } catch (error) {
    console.error("Error checking activity availability:", error);
    res.status(500).json({
      message: "Failed to check activity availability",
      error: error.message
    });
  }
};

/**
 * Get activities with enhanced scheduling information
 */
exports.getActivitiesWithScheduling = async (req, res) => {
  const { destinationId } = req.query;

  try {
    let query = `
      SELECT a.*, d.name as destination_name, d.region as destination_region
      FROM activities a
      JOIN destinations d ON a.destination_id = d.id
    `;
    let params = [];

    if (destinationId) {
      query += " WHERE a.destination_id = ?";
      params.push(destinationId);
    }

    query += " ORDER BY a.name";

    const [activities] = await db.query(query, params);

    // Parse JSON fields and add availability summary
    const enhancedActivities = activities.map(activity => {
      let timeSlots = [];
      let availableDates = [];

      try {
        timeSlots = activity.time_slots ? JSON.parse(activity.time_slots) : [];
        availableDates = activity.available_dates ? JSON.parse(activity.available_dates) : [];
      } catch (e) {
        console.error('Failed to parse scheduling data for activity:', activity.id);
      }

      return {
        ...activity,
        time_slots: timeSlots,
        available_dates: availableDates,
        has_scheduling: timeSlots.length > 0 || availableDates.length > 0,
        flexible_timing: timeSlots.length === 0 && availableDates.length === 0
      };
    });

    res.status(200).json(enhancedActivities);
  } catch (error) {
    console.error("Error fetching activities with scheduling:", error);
    res.status(500).json({
      message: "Failed to fetch activities",
      error: error.message
    });
  }
};
