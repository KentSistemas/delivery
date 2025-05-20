
# Supabase Row Level Security (RLS) Policies

This document outlines the Row Level Security (RLS) policies implemented for the project's Supabase database to ensure data security and proper access control.

**General Principles:**
- Access is denied by default unless a policy explicitly grants it.
- Users are granted the least privilege necessary for their roles.
- Most operations require user authentication.
- User roles (admin, garcom) defined in the `user_roles` table are used to differentiate permissions.

---

## Table: `menu_items`

-   **Policy:** `Allow public read access for menu_items`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true` (always allowed)
    -   **Purpose:** Allows the menu items to be displayed publicly on the frontend.

-   **Policy:** `Allow admin full access for menu_items`
    -   **Action:** `ALL` (SELECT, INSERT, UPDATE, DELETE)
    -   **Who:** Authenticated users who are admins (`is_admin = true` in `user_roles`)
    -   **Condition:** Checks if the current user's ID exists in `user_roles` with `is_admin = true`.
    -   **Purpose:** Allows administrators to manage all aspects of menu items.

---

## Table: `categories`

-   **Policy:** `Allow public read access for categories`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows categories to be displayed publicly.

-   **Policy:** `Allow admin full access for categories`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage categories.

---

## Table: `user_roles`

-   **Policy:** `Allow admin to manage user_roles`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage user roles (assign admin/garcom status).

-   **Policy:** `Allow users to read their own role`
    -   **Action:** `SELECT`
    -   **Who:** Authenticated users.
    -   **Condition:** `auth.uid() = user_id` (current user's ID matches the `user_id` in the row).
    -   **Purpose:** Allows users to see their own role information.

---

## Table: `configuracao_loja`

-   **Policy:** `Allow public read access for configuracao_loja`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows frontend to fetch store configuration for display.

-   **Policy:** `Allow admin full access for configuracao_loja`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage store settings.

---

## Table: `orders`

-   **Policy:** `Allow authenticated users to create orders`
    -   **Action:** `INSERT`
    -   **Who:** Any authenticated user.
    -   **Condition:** `auth.role() = 'authenticated'`
    -   **Purpose:** Allows logged-in users (customers, garçons, admins) to place new orders.
    -   **Note:** For more granular customer-specific order creation, a `user_id` column linked to `auth.users` would be beneficial in the `orders` table.

-   **Policy:** `Allow admin and garcom to manage orders`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin or garcom users.
    -   **Condition:** Checks if the current user has `is_admin = true` OR `is_garcom = true` in `user_roles`.
    -   **Purpose:** Allows admins and garçons to view, update status, and manage all orders.

-   **Future Consideration (Requires `user_id` in `orders` table):**
    -   **Policy:** `Allow users to read their own orders`
        -   **Action:** `SELECT`
        -   **Who:** Authenticated users.
        -   **Condition:** `auth.uid() = user_id` (if `user_id` column is added to `orders` table).
        -   **Purpose:** Allows customers to view their own order history.

---

## Table: `addon_categories`

-   **Policy:** `Allow public read access for addon_categories`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows addon categories to be displayed publicly.

-   **Policy:** `Allow admin full access for addon_categories`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage addon categories.

---

## Table: `addons`

-   **Policy:** `Allow public read access for addons`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows addons to be displayed publicly.

-   **Policy:** `Allow admin full access for addons`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage addons.

---

## Table: `product_addon_categories`

-   **Policy:** `Allow public read access for product_addon_categories`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows the relationship between products and addon categories to be read publicly for menu display.

-   **Policy:** `Allow admin full access for product_addon_categories`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage product-addon category links.

---

## Table: `tables`

-   **Policy:** `Allow public read access for tables QR codes`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows table information (like QR codes) to be read publicly, e.g., for customers to scan and start an order.

-   **Policy:** `Allow admin and garcom to manage tables`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin or garcom users.
    -   **Condition:** Checks `is_admin = true` OR `is_garcom = true` for the current user.
    -   **Purpose:** Allows admins and garçons to manage tables (create, update status, etc.).

---

## Table: `delivery_config`

-   **Policy:** `Allow public read access for delivery_config`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows frontend to fetch delivery configurations.

-   **Policy:** `Allow admin full access for delivery_config`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage delivery configurations.

---

## Table: `store_operation_settings`

-   **Policy:** `Allow public read access for store_operation_settings`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows frontend to fetch store operation settings (open/closed status, hours).

-   **Policy:** `Allow admin full access for store_operation_settings`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage store operation settings.

---

## Table: `delivery_neighborhoods`

-   **Policy:** `Allow public read access for delivery_neighborhoods`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows frontend to display available delivery neighborhoods and fees.

-   **Policy:** `Allow admin full access for delivery_neighborhoods`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage delivery neighborhoods.

---

## Table: `delivery_regions`

-   **Policy:** `Allow public read access for delivery_regions`
    -   **Action:** `SELECT`
    -   **Who:** Anyone (public)
    -   **Condition:** `true`
    -   **Purpose:** Allows frontend to display available delivery regions and fees.

-   **Policy:** `Allow admin full access for delivery_regions`
    -   **Action:** `ALL`
    -   **Who:** Authenticated admin users.
    -   **Condition:** Checks `is_admin = true` for the current user.
    -   **Purpose:** Allows administrators to manage delivery regions.

---

**Note on `gestor` and `sistema_config` tables:**
These tables were not given RLS policies in this pass as their usage and user-specific access patterns are unclear from the current application structure. If they store sensitive or user-specific data, appropriate RLS policies should be added. `sistema_config` appears to be global configuration and might be better managed via environment variables or a more restricted admin interface if it contains sensitive keys.
