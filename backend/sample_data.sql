-- Insert sample destinations
INSERT IGNORE INTO destinations (name, region, description, image_url) VALUES 
('Serengeti National Park', 'Mara Region, Tanzania', 'Famous for its annual migration of wildebeest and zebras.', 'https://example.com/serengeti.jpg'),
('Mount Kilimanjaro', 'Kilimanjaro Region, Tanzania', 'The highest mountain in Africa and a popular climbing destination.', 'https://example.com/kilimanjaro.jpg'),
('Zanzibar', 'Zanzibar, Tanzania', 'Beautiful island with stunning beaches and rich cultural heritage.', 'https://example.com/zanzibar.jpg');

-- Insert sample activities
INSERT IGNORE INTO activities (destination_id, name, description, price, time_slots, available_dates) VALUES 
(1, 'Wildlife Safari Tour', 'Experience the incredible wildlife of Serengeti with expert guides.', 250.00, 
'[{"start_time":"06:00","end_time":"12:00","max_participants":8},{"start_time":"14:00","end_time":"18:00","max_participants":8}]',
'[{"date":"2024-12-20","available_slots":[0,1]},{"date":"2024-12-21","available_slots":[0,1]},{"date":"2024-12-22","available_slots":[0,1]},{"date":"2024-12-23","available_slots":[1]},{"date":"2024-12-24","available_slots":[0,1]}]'),

(2, 'Kilimanjaro Day Hike', 'A challenging day hike on the lower slopes of Kilimanjaro.', 150.00,
'[{"start_time":"05:00","end_time":"17:00","max_participants":6}]',
'[{"date":"2024-12-20","available_slots":[0]},{"date":"2024-12-21","available_slots":[0]},{"date":"2024-12-22","available_slots":[]},{"date":"2024-12-23","available_slots":[0]},{"date":"2024-12-24","available_slots":[0]}]'),

(3, 'Spice Tour & Cultural Experience', 'Discover the spice farms and rich culture of Zanzibar.', 80.00,
'[{"start_time":"09:00","end_time":"13:00","max_participants":12},{"start_time":"15:00","end_time":"19:00","max_participants":12}]',
'[{"date":"2024-12-20","available_slots":[0,1]},{"date":"2024-12-21","available_slots":[0,1]},{"date":"2024-12-22","available_slots":[0,1]},{"date":"2024-12-23","available_slots":[0,1]},{"date":"2024-12-24","available_slots":[0]}]');
