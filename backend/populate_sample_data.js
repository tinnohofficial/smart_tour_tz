const mysql = require('mysql2/promise');
require('dotenv').config();

async function populateSampleData() {
    let connection;
    
    try {
        // Create connection
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            charset: 'utf8mb4'
        };

        // Only add SSL for remote databases
        if (process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
            config.ssl = { rejectUnauthorized: false };
        }

        connection = await mysql.createConnection(config);
        console.log('Database connected successfully!');

        // Insert sample destinations
        const destinations = [
            {
                name: 'Serengeti National Park',
                location: 'Mara Region, Tanzania',
                description: 'Famous for its annual migration of wildebeest and zebras.',
                image_url: 'https://example.com/serengeti.jpg'
            },
            {
                name: 'Mount Kilimanjaro',
                location: 'Kilimanjaro Region, Tanzania',
                description: 'The highest mountain in Africa and a popular climbing destination.',
                image_url: 'https://example.com/kilimanjaro.jpg'
            },
            {
                name: 'Zanzibar',
                location: 'Zanzibar, Tanzania',
                description: 'Beautiful island with stunning beaches and rich cultural heritage.',
                image_url: 'https://example.com/zanzibar.jpg'
            }
        ];

        console.log('Inserting destinations...');
        for (const dest of destinations) {
            await connection.execute(
                'INSERT IGNORE INTO destinations (name, location, description, image_url) VALUES (?, ?, ?, ?)',
                [dest.name, dest.location, dest.description, dest.image_url]
            );
        }

        // Get destination IDs
        const [destRows] = await connection.execute('SELECT id, name FROM destinations');
        const destMap = {};
        destRows.forEach(row => {
            destMap[row.name] = row.id;
        });

        // Insert sample activities with availability data
        const activities = [
            {
                destination_id: destMap['Serengeti National Park'],
                name: 'Wildlife Safari Tour',
                description: 'Experience the incredible wildlife of Serengeti with expert guides.',
                price: 250.00,
                time_slots: JSON.stringify([
                    { start_time: '06:00', end_time: '12:00', max_participants: 8 },
                    { start_time: '14:00', end_time: '18:00', max_participants: 8 }
                ]),
                available_dates: JSON.stringify([
                    { date: '2024-12-20', available_slots: [0, 1] },
                    { date: '2024-12-21', available_slots: [0, 1] },
                    { date: '2024-12-22', available_slots: [0, 1] },
                    { date: '2024-12-23', available_slots: [1] },
                    { date: '2024-12-24', available_slots: [0, 1] }
                ])
            },
            {
                destination_id: destMap['Mount Kilimanjaro'],
                name: 'Kilimanjaro Day Hike',
                description: 'A challenging day hike on the lower slopes of Kilimanjaro.',
                price: 150.00,
                time_slots: JSON.stringify([
                    { start_time: '05:00', end_time: '17:00', max_participants: 6 }
                ]),
                available_dates: JSON.stringify([
                    { date: '2024-12-20', available_slots: [0] },
                    { date: '2024-12-21', available_slots: [0] },
                    { date: '2024-12-22', available_slots: [] },
                    { date: '2024-12-23', available_slots: [0] },
                    { date: '2024-12-24', available_slots: [0] }
                ])
            },
            {
                destination_id: destMap['Zanzibar'],
                name: 'Spice Tour & Cultural Experience',
                description: 'Discover the spice farms and rich culture of Zanzibar.',
                price: 80.00,
                time_slots: JSON.stringify([
                    { start_time: '09:00', end_time: '13:00', max_participants: 12 },
                    { start_time: '15:00', end_time: '19:00', max_participants: 12 }
                ]),
                available_dates: JSON.stringify([
                    { date: '2024-12-20', available_slots: [0, 1] },
                    { date: '2024-12-21', available_slots: [0, 1] },
                    { date: '2024-12-22', available_slots: [0, 1] },
                    { date: '2024-12-23', available_slots: [0, 1] },
                    { date: '2024-12-24', available_slots: [0] }
                ])
            }
        ];

        console.log('Inserting activities...');
        for (const activity of activities) {
            await connection.execute(
                'INSERT IGNORE INTO activities (destination_id, name, description, price, time_slots, available_dates) VALUES (?, ?, ?, ?, ?, ?)',
                [activity.destination_id, activity.name, activity.description, activity.price, activity.time_slots, activity.available_dates]
            );
        }

        console.log('Sample data populated successfully!');
        
        // Verify data
        const [activityCount] = await connection.execute('SELECT COUNT(*) as count FROM activities');
        const [destinationCount] = await connection.execute('SELECT COUNT(*) as count FROM destinations');
        
        console.log(`Destinations: ${destinationCount[0].count}`);
        console.log(`Activities: ${activityCount[0].count}`);

    } catch (error) {
        console.error('Error populating sample data:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

populateSampleData();
