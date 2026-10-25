-- ==========================================================
-- PG HOSTEL MANAGEMENT SYSTEM - SAMPLE DATA (MySQL 8.0+)
-- ==========================================================

USE `pg_hostel_db`;

-- 1. Default Admin User (Password: admin123)
-- Hash generated via bcrypt
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `name`, `phone`, `avatar`)
VALUES (1, 'admin', 'admin@hostel.com', '$2a$10$wO3t4hN3K4v1f87H8eL5eO8J0x0yK41u4z8d6aH2sX7y9W5c4m7u2', 'admin', 'Hostel Chief Warden', '+91 98111 22334', '/assets/images/default-avatar.png')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Ravi Kumar Student User (Password: student123)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `name`, `phone`, `avatar`)
VALUES (2, '2024IT123', 'ravi.kumar@college.edu', '$2a$10$f3W7rJ2kL1b8v0P8z6c1UeQ9w0zK41u4z8d6aH2sX7y9W5c4m7u2', 'student', 'Ravi Kumar', '+91 98765 43210', '/assets/images/default-student.png')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. Floors (1 to 5)
INSERT INTO `floors` (`id`, `floor_number`, `name`, `description`) VALUES
(1, 1, 'Floor 1', '1st Floor - Student Residential Wing'),
(2, 2, 'Floor 2', '2nd Floor - Student Residential Wing'),
(3, 3, 'Floor 3', '3rd Floor - Student Residential Wing'),
(4, 4, 'Floor 4', '4th Floor - Student Residential Wing'),
(5, 5, 'Floor 5', '5th Floor - Student Residential Wing')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Sample Settings
INSERT INTO `settings` (`key_name`, `value`, `description`) VALUES
('hostel_name', 'PG Hostel Management System', 'Hostel Name'),
('hostel_address', 'Knowledge Park III, Institutional Area, Greater Noida, UP - 201306', 'Hostel Official Address'),
('contact_phone', '+91 120 232 4000', 'Helpline Phone Number'),
('contact_email', 'warden@pghostel.edu', 'Official Email'),
('default_monthly_fee', '7000', 'Default Monthly Fee'),
('curfew_time', '10:00 PM', 'Night Curfew Time')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);
