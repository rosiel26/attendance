-- ============================================
-- Insert sample attendance and leave data for testing
-- ============================================

-- Get the employee IDs (direct reports of irisluna)
-- irisluna's ID: 7f4304d3-bc12-4827-860a-f96866331e7c

-- Insert sample attendance records for today for employee (1836bd18-ed7f-4a51-a65b-1c4397806f20)
INSERT INTO attendance (user_id, check_in_time, check_out_time, status, duration_hours, geolocation)
VALUES 
('1836bd18-ed7f-4a51-a65b-1c4397806f20', now() - interval '8 hours', now() - interval '1 hour', 'checked-out', 7.0, '{"lat": 14.5995, "lng": 120.9842}'),
('71e4cd12-ee47-47f1-8f2b-73dc7c0fc144', now() - interval '9 hours', now() - interval '2 hours', 'checked-out', 7.0, '{"lat": 14.5995, "lng": 120.9842}')
ON CONFLICT DO NOTHING;

-- Insert a sample pending leave request for employee
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status, created_at)
VALUES 
('1836bd18-ed7f-4a51-a65b-1c4397806f20', 'sick', CURRENT_DATE + 1, CURRENT_DATE + 2, 'Doctor appointment', 'pending', now()),
('71e4cd12-ee47-47f1-8f2b-73dc7c0fc144', 'personal', CURRENT_DATE + 3, CURRENT_DATE + 3, 'Personal errand', 'pending', now())
ON CONFLICT DO NOTHING;

-- Insert a sample pending attendance correction
INSERT INTO attendance_corrections (user_id, attendance_date, missing_type, requested_time, reason, status, requested_by, created_at)
VALUES 
('1836bd18-ed7f-4a51-a65b-1c4397806f20', CURRENT_DATE - 1, 'check_in', '09:00:00', 'Forgot to check in', 'pending', '1836bd18-ed7f-4a51-a65b-1c4397806f20', now())
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 
  (SELECT COUNT(*) FROM attendance WHERE user_id IN ('1836bd18-ed7f-4a51-a65b-1c4397806f20', '71e4cd12-ee47-47f1-8f2b-73dc7c0fc144')) as attendance_count,
  (SELECT COUNT(*) FROM leave_requests WHERE user_id IN ('1836bd18-ed7f-4a51-a65b-1c4397806f20', '71e4cd12-ee47-47f1-8f2b-73dc7c0fc144')) as leave_requests_count,
  (SELECT COUNT(*) FROM attendance_corrections WHERE user_id IN ('1836bd18-ed7f-4a51-a65b-1c4397806f20', '71e4cd12-ee47-47f1-8f2b-73dc7c0fc144')) as corrections_count;
