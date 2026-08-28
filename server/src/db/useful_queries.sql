-- ============================================================================
-- Useful Operational SQL Queries for PostgreSQL / Neon SQL Console
-- Premium PC E-Commerce Platform
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USER & CUSTOMER MANAGEMENT
-- ----------------------------------------------------------------------------

-- 1.1 View all registered users with their full name, role, status, and created date
SELECT 
  id, 
  email, 
  first_name || ' ' || last_name AS full_name, 
  phone,
  role, 
  status, 
  email_verified, 
  created_at 
FROM users 
ORDER BY created_at DESC;

-- 1.2 View all SAVED SHIPPING ADDRESSES across all customers
SELECT 
  ua.id AS address_id,
  u.email AS customer_email,
  ua.full_name AS recipient_name,
  ua.street,
  ua.city,
  ua.state,
  ua.zip_code,
  ua.country,
  ua.phone,
  ua.is_default,
  ua.created_at
FROM user_addresses ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.is_default DESC, ua.created_at DESC;

-- 1.3 View user registration summary (total count by role and status)
SELECT 
  role, 
  status, 
  COUNT(*) AS total_users 
FROM users 
GROUP BY role, status 
ORDER BY role, status;

-- 1.3 View customers with their total order count and total spent
SELECT 
  u.id, 
  u.email, 
  u.first_name || ' ' || u.last_name AS customer_name, 
  COUNT(o.id) AS total_orders, 
  COALESCE(SUM(o.total), 0.00) AS total_spent 
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
GROUP BY u.id, u.email, u.first_name, u.last_name 
ORDER BY total_spent DESC;

-- 1.4 PROMOTE a user to ADMIN role (Replace email address as needed)
UPDATE users 
SET role = 'admin' 
WHERE email = '2020sumoy@gmail.com';

-- 1.5 DEMOTE an admin to regular CUSTOMER role
UPDATE users 
SET role = 'customer' 
WHERE email = 'someuser@example.com';


-- ----------------------------------------------------------------------------
-- 2. ORDER TRACKING & REVENUE OVERVIEW
-- ----------------------------------------------------------------------------

-- 2.1 All recent orders with customer name, payment status, fulfillment status, and total
SELECT 
  order_number, 
  customer_email, 
  shipping_name, 
  status AS fulfillment_status, 
  payment_status, 
  payment_method, 
  total, 
  tracking_number, 
  created_at 
FROM orders 
ORDER BY created_at DESC;

-- 2.2 Orders breakdown by status (Processing, Assembling, Shipped, Delivered, Cancelled)
SELECT 
  status AS order_status, 
  COUNT(*) AS total_orders, 
  SUM(total) AS total_value 
FROM orders 
GROUP BY status 
ORDER BY total_orders DESC;

-- 2.3 Store revenue summary (Total Paid Revenue, Total Orders, Average Order Value)
SELECT 
  COUNT(*) AS paid_orders_count, 
  SUM(total) AS total_revenue, 
  ROUND(AVG(total), 2) AS average_order_value 
FROM orders 
WHERE payment_status = 'paid';


-- ----------------------------------------------------------------------------
-- 3. DISPATCH & SHIPPING MANAGEMENT
-- ----------------------------------------------------------------------------

-- 3.1 Orders READY FOR DISPATCH (Paid orders that have NOT been shipped yet)
SELECT 
  order_number, 
  shipping_name, 
  shipping_street || ', ' || shipping_city || ', ' || shipping_state || ' ' || shipping_zip AS full_shipping_address, 
  customer_phone, 
  customer_email, 
  status, 
  created_at 
FROM orders 
WHERE payment_status = 'paid' 
  AND status IN ('processing', 'assembling', 'quality_check') 
ORDER BY created_at ASC;

-- 3.2 Shipped orders WITH tracking details for dispatch verification
SELECT 
  order_number, 
  shipping_name, 
  tracking_number, 
  estimated_delivery, 
  status, 
  updated_at AS shipped_at 
FROM orders 
WHERE status = 'shipped' 
ORDER BY updated_at DESC;

-- 3.3 Paid orders missing tracking numbers (Attention Required for Courier Dispatch)
SELECT 
  order_number, 
  shipping_name, 
  customer_email, 
  status, 
  created_at 
FROM orders 
WHERE payment_status = 'paid' 
  AND status = 'shipped' 
  AND (tracking_number IS NULL OR tracking_number = '');


-- ----------------------------------------------------------------------------
-- 4. RETURNS, REFUNDS & CANCELLATIONS
-- ----------------------------------------------------------------------------

-- 4.1 Cancelled and Refunded orders report
SELECT 
  order_number, 
  customer_email, 
  shipping_name, 
  status AS order_status, 
  payment_status, 
  total AS order_total, 
  updated_at AS timestamp 
FROM orders 
WHERE status IN ('cancelled', 'refunded') OR payment_status = 'refunded' 
ORDER BY updated_at DESC;

-- 4.2 Total financial refunds summary
SELECT 
  COUNT(*) AS total_refunded_orders, 
  COALESCE(SUM(total), 0.00) AS total_refunded_amount 
FROM orders 
WHERE payment_status = 'refunded' OR status = 'refunded';

-- 4.3 Detailed audit timeline for a specific order (replace 'ORD-...' with actual order number)
SELECT 
  o.order_number, 
  ot.status, 
  ot.description, 
  ot.created_at 
FROM order_timeline ot 
JOIN orders o ON ot.order_id = o.id 
WHERE o.order_number = 'ORD-2026-1001' 
ORDER BY ot.created_at ASC;


-- ----------------------------------------------------------------------------
-- 5. INVENTORY & STOCK MANAGEMENT
-- ----------------------------------------------------------------------------

-- 5.1 Low stock and Out of stock alerts
SELECT 
  p.sku, 
  p.name AS product_name, 
  inv.quantity_on_hand, 
  inv.quantity_reserved, 
  inv.quantity_available, 
  inv.stock_status 
FROM inventory_status inv 
JOIN products p ON inv.product_id = p.id 
WHERE inv.stock_status IN ('low-stock', 'out-of-stock') 
ORDER BY inv.quantity_available ASC;

-- 5.2 Best-selling products by quantity sold and revenue generated
SELECT 
  oi.product_name, 
  oi.product_sku, 
  SUM(oi.quantity) AS total_units_sold, 
  SUM(oi.line_total) AS total_revenue 
FROM order_items oi 
JOIN orders o ON oi.order_id = o.id 
WHERE o.payment_status = 'paid' 
GROUP BY oi.product_name, oi.product_sku 
ORDER BY total_units_sold DESC 
LIMIT 10;
