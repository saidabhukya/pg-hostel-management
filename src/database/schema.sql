-- ==========================================================
-- SRI RAM PG - DATABASE SCHEMA (MySQL 8.0+)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `pg_hostel_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pg_hostel_db`;

-- 1. USERS TABLE (Authentication for Admin and Students)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(25) NULL,
  `avatar` VARCHAR(255) DEFAULT '/assets/images/default-avatar.png',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. FLOORS TABLE (1F to 5F)
CREATE TABLE IF NOT EXISTS `floors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `floor_number` INT NOT NULL UNIQUE,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT 'Hostel Floor Block',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ROOMS TABLE (10 rooms per floor => 50 rooms total)
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `floor_id` INT NOT NULL,
  `room_number` VARCHAR(20) NOT NULL UNIQUE,
  `capacity` INT NOT NULL DEFAULT 5,
  `type` VARCHAR(50) DEFAULT 'Standard 5-Bed',
  `status` ENUM('active', 'maintenance') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. BEDS TABLE (5 beds per room => 250 beds total)
CREATE TABLE IF NOT EXISTS `beds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `bed_number` INT NOT NULL,
  `bed_label` VARCHAR(30) NOT NULL,
  `status` ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_room_bed` (`room_id`, `bed_number`),
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNIQUE NULL,
  `reg_number` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(25) NOT NULL,
  `college` VARCHAR(200) NOT NULL,
  `course` VARCHAR(100) NOT NULL,
  `year` VARCHAR(20) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  `parent_name` VARCHAR(150) NOT NULL,
  `parent_phone` VARCHAR(25) NOT NULL,
  `address` TEXT NOT NULL,
  `photo_url` VARCHAR(255) DEFAULT '/assets/images/default-student.png',
  `id_proof_url` VARCHAR(255) NULL,
  `joining_date` DATE NOT NULL,
  `monthly_fee` DECIMAL(10, 2) NOT NULL DEFAULT 7000.00,
  `status` ENUM('active', 'inactive', 'left') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ALLOCATIONS TABLE (Beds allocated to students)
CREATE TABLE IF NOT EXISTS `allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `bed_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `status` ENUM('active', 'transferred', 'vacated') DEFAULT 'active',
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bed_id`) REFERENCES `beds`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. FEE CYCLES TABLE (Joining-Date Based Billing Cycles)
CREATE TABLE IF NOT EXISTS `fee_cycles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `cycle_number` INT NOT NULL DEFAULT 1,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 7000.00,
  `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'paid', 'partially_paid', 'overdue') DEFAULT 'pending',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. PAYMENTS TABLE (Recorded Transactions & Receipts)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `fee_cycle_id` INT NULL,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `cycle_start_date` DATE NOT NULL,
  `cycle_end_date` DATE NOT NULL,
  `payment_method` ENUM('Cash', 'UPI', 'Bank Transfer', 'Card') NOT NULL,
  `transaction_id` VARCHAR(100) NULL,
  `status` ENUM('PAID', 'PENDING', 'FAILED') DEFAULT 'PAID',
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fee_cycle_id`) REFERENCES `fee_cycles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `category` ENUM('Electrical', 'Plumbing', 'Cleaning', 'Wi-Fi', 'Food', 'Room', 'Other') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `photo_url` VARCHAR(255) NULL,
  `status` ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
  `admin_notes` TEXT NULL,
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. VISITORS TABLE
CREATE TABLE IF NOT EXISTS `visitors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `visitor_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(25) NOT NULL,
  `relation` VARCHAR(50) DEFAULT 'Parent/Relative',
  `purpose` VARCHAR(255) NOT NULL,
  `entry_time` DATETIME NOT NULL,
  `exit_time` DATETIME NULL,
  `status` ENUM('in_hostel', 'checked_out') DEFAULT 'in_hostel',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. MESS MENU TABLE
CREATE TABLE IF NOT EXISTS `mess_menu` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL UNIQUE,
  `breakfast` TEXT NOT NULL,
  `breakfast_timing` VARCHAR(50) DEFAULT '7:30 AM - 9:30 AM',
  `lunch` TEXT NOT NULL,
  `lunch_timing` VARCHAR(50) DEFAULT '12:30 PM - 2:30 PM',
  `dinner` TEXT NOT NULL,
  `dinner_timing` VARCHAR(50) DEFAULT '7:30 PM - 9:30 PM',
  `special_notes` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` ENUM('Electricity', 'Water', 'Internet', 'Food', 'Cleaning', 'Maintenance', 'Salary', 'Repairs', 'Other') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `receipt_ref` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `audience` ENUM('all', 'students', 'staff') DEFAULT 'all',
  `published_date` DATE NOT NULL,
  `expires_at` DATE NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('fee_due', 'payment', 'complaint', 'announcement', 'leave', 'system') NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `link` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `emergency_contact` VARCHAR(25) NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `admin_remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key_name` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
