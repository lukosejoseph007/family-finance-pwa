-- Clear existing user data to allow fresh family creation
-- Run this if you get "User already belongs to a family" error

-- Delete all existing user records (this will cascade to related data)
DELETE FROM users;

-- Delete all existing families
DELETE FROM families;

-- Reset any sequences if needed
-- Note: This will clear all data - use only for development/testing