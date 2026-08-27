# PREMIUM PC — API Documentation

Welcome to the **PREMIUM PC REST API** documentation. All requests and responses use standard JSON formatting with consistent status codes and envelope wrappers.

Base API URL: `http://localhost:3001/api`

---

## Standard Envelope Formats

### Success Response
```json
{
  "success": true,
  "data": {}
}
```

### Collection Response with Pagination
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product was not found.",
    "errors": {}
  }
}
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new customer account.
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "StrongPassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1 555-0199"
  }
  ```
- **Response**: `{ "user": { ... }, "token": "jwt_token_string" }`

### `POST /api/auth/login`
Authenticates a user and issues a JWT token.
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response**: `{ "user": { ... }, "token": "jwt_token_string" }`

### `POST /api/auth/logout`
Logs out current session.
- **Auth**: Bearer Token
- **Response**: `204 No Content`

### `GET /api/auth/me`
Retrieves current authenticated profile.
- **Auth**: Bearer Token
- **Response**: `{ "user": { ... } }`

---

## 2. User Profile (`/api/users`)

### `GET /api/users/me`
Fetch full profile details for the authenticated user.
- **Auth**: Bearer Token
- **Response**: `{ "user": { ... } }`

### `PATCH /api/users/me`
Update profile details for the authenticated user.
- **Auth**: Bearer Token
- **Body**: `{ "firstName": "John", "lastName": "Smith", "phone": "+1 555-0200" }`
- **Response**: `{ "user": { ... } }`

---

## 3. Products (`/api/products`)

### `GET /api/products`
Fetch paginated products catalog with filtering and sorting.
- **Auth**: Optional
- **Query Params**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `24`)
  - `search`: Keyword query across title, SKU, description
  - `category`: Category slug
  - `brand`: Brand slug
  - `minPrice`: Minimum price limit
  - `maxPrice`: Maximum price limit
  - `sort`: `price_asc` | `price_desc` | `rating_desc` | `newest` | `featured`
- **Response**: List of products with `pagination` metadata.

### `GET /api/products/:slug`
Fetch full product details by URL slug.
- **Auth**: Optional
- **Response**: `{ "product": { ... } }`

### `POST /api/products`
Create a new product.
- **Auth**: Required (`admin` / `staff`)
- **Body**: Product fields (`name`, `sku`, `price`, `categoryId`, `brandId`, etc.)
- **Response**: `{ "product": { ... } }`

### `PUT /api/products/:id`
Update an existing product.
- **Auth**: Required (`admin` / `staff`)

### `DELETE /api/products/:id`
Delete a product.
- **Auth**: Required (`admin`)

---

## 4. Search (`/api/search`)

### `GET /api/search`
PostgreSQL full-text search across product name, SKU, category, and brand.
- **Query Params**: `q` (query string), `page`, `limit`
- **Response**: Search result items with `pagination` metadata.

### `GET /api/search/suggest`
Instant search suggestions for typeahead UI.
- **Query Params**: `q`
- **Response**: `{ "suggestions": [ { "name": "...", "slug": "..." } ] }`

---

## 5. Cart (`/api/cart`)

### `GET /api/cart`
Retrieve active cart (backed by authenticated user ID or anonymous session cookie).
- **Auth**: Optional
- **Response**: `{ "cart": { "items": [], "subtotal": 0 } }`

### `POST /api/cart/items`
Add item to cart. Quantity is validated server-side.
- **Body**: `{ "productId": "uuid", "quantity": 1 }`

### `PUT /api/cart/items/:productId`
Update item quantity in cart. Setting quantity to `0` removes the item.
- **Body**: `{ "quantity": 2 }`

### `DELETE /api/cart`
Clear all items in cart.

---

## 6. Wishlist (`/api/wishlist`)

### `GET /api/wishlist`
Fetch user wishlist items.
- **Auth**: Bearer Token
- **Response**: `{ "wishlist": [ ... ], "wishlistIds": [ ... ] }`

### `POST /api/wishlist/:productId`
Add product to wishlist.
- **Auth**: Bearer Token

### `DELETE /api/wishlist/:productId`
Remove product from wishlist.
- **Auth**: Bearer Token

---

## 7. Orders (`/api/orders`)

### `POST /api/orders`
Creates a new order with server-calculated price integrity and atomic inventory reservation.
- **Auth**: Optional (Guest checkout supported)
- **Body**:
  ```json
  {
    "items": [ { "productId": "uuid", "quantity": 1 } ],
    "shippingName": "John Doe",
    "shippingStreet": "123 Tech Lane",
    "shippingCity": "Austin",
    "shippingState": "TX",
    "shippingZip": "78701",
    "shippingCountry": "USA",
    "shippingMethod": "standard",
    "paymentMethod": "card"
  }
  ```
- **Response**: `{ "order": { "id": "uuid", "orderNumber": "PPC-84920", "total": 1999.99, ... } }`

### `GET /api/orders`
List orders for the authenticated user.
- **Auth**: Bearer Token

### `GET /api/orders/:id`
Get full order details including historical item snapshots.
- **Auth**: Bearer Token

### `GET /api/orders/track/:orderNumber`
Public order tracking by order number.
- **Auth**: None

---

## 8. Reviews (`/api/reviews` & `/api/products/:id/reviews`)

### `GET /api/products/:id/reviews`
List approved reviews for a product.
- **Auth**: None

### `POST /api/products/:id/reviews`
Create product review. Automatically flags verified purchases.
- **Auth**: Bearer Token
- **Body**: `{ "rating": 5, "title": "Great GPU!", "content": "Runs silent..." }`

---

## 9. Admin Management (`/api/admin/*`)

- `GET /api/admin/dashboard`: Sales summary & metrics.
- `GET /api/admin/products`: Product CMS table with pagination.
- `GET /api/admin/orders`: Order CMS table with status update capabilities.
- `PUT /api/admin/orders/:id/status`: Update order status (`processing`, `assembling`, `shipped`, `delivered`).
- `GET /api/admin/inventory`: Inventory stock matrix.
- `PUT /api/admin/inventory/:productId`: Adjust `quantity_on_hand` stock.
