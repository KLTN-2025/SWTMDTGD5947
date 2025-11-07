# API Integration Documentation

## Overview

This document outlines the integration between the React frontend and PHP Laravel backend for the shoe store application.

## API Structure

### Base URL
- Development: `http://localhost:8009/api`
- Configure via `VITE_API_BASE_URL` environment variable

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/login` | User login | `{email, password}` | `{access_token, user}` |
| POST | `/auth/register` | User registration | `{name, userName, email, password}` | `{user}` |
| POST | `/auth/logout` | User logout | - | `{message}` |
| GET | `/auth/google` | Google OAuth redirect | - | Redirect |
| GET | `/auth/google/callback` | Google OAuth callback | - | `{access_token, user}` |
| POST | `/auth/send-email-reset-pass` | Send password reset email | `{email}` | `{message}` |
| POST | `/auth/reset-password` | Reset password | `{password, re_password, token}` | `{message}` |

### Product Endpoints

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| GET | `/products` | Get all products | `per_page`, `page` | `{products[], pagination}` |
| GET | `/products/search` | Search products | `keyword`, `category_id`, `min_price`, `max_price`, `status`, `sort_by`, `sort_order`, `per_page` | `{products[], pagination}` |
| GET | `/products/{id}` | Get product by ID | - | `{product}` |
| POST | `/products` | Create product (admin) | FormData or JSON | `{product}` |
| PUT | `/products/{id}` | Update product (admin) | FormData or JSON | `{product}` |
| DELETE | `/products/{id}` | Delete product (admin) | - | `{message}` |
| DELETE | `/products/images/{imageId}` | Delete product image (admin) | - | `{message}` |

## Response Format

All API responses follow this consistent format:

```typescript
{
  code: number;           // HTTP status code
  status: boolean;        // Success/failure indicator
  msgCode: string;        // Internal message code
  message: string;        // Human-readable message
  data?: any;            // Response data (optional)
}
```

## Frontend Integration

### Files Created/Updated

#### API Layer
- `client/lib/api-types.ts` - TypeScript interfaces for all API types
- `client/lib/api-client.ts` - Base API client with error handling
- `client/lib/auth-api.ts` - Authentication API methods
- `client/lib/product-api.ts` - Product API methods

#### State Management
- `client/state/auth.tsx` - Updated auth context with PHP API integration
- `client/hooks/useProducts.ts` - Product data management hooks

#### Pages
- `client/pages/auth/Auth.tsx` - Updated authentication page
- `client/pages/auth/ResetPassword.tsx` - New password reset page
- `client/pages/Products.tsx` - Updated products page with API integration

#### Configuration
- `.env.example` - Environment configuration template

### Key Features

#### Authentication
- ✅ Email/password login and registration
- ✅ Google OAuth integration
- ✅ Password reset via email
- ✅ JWT token management via HTTP-only cookies
- ✅ Automatic auth state persistence
- ✅ Loading states and error handling

#### Products
- ✅ Product listing with pagination
- ✅ Product search and filtering
- ✅ Product detail view
- ✅ Admin product management (CRUD)
- ✅ Image upload support
- ✅ Real-time loading states

#### Error Handling
- ✅ Comprehensive error handling for all API calls
- ✅ User-friendly error messages
- ✅ Validation error display
- ✅ Network error handling

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the API base URL if needed:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

### 2. PHP Backend Setup

Ensure your PHP backend is running on `http://localhost:8000` with:
- CORS configured for your frontend domain
- Session/cookie configuration for authentication
- All API endpoints implemented as documented

### 3. Frontend Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## API Usage Examples

### Authentication

```typescript
import { useAuth } from '@/state/auth';

function LoginComponent() {
  const { login, loading, user } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      // User is now logged in
    } catch (error) {
      // Handle error
    }
  };
}
```

### Products

```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductsComponent() {
  const { products, pagination, loading, error, refetch } = useProducts();
  
  // Products are automatically loaded
  // Use refetch() to reload data
}
```

### Product Search

```typescript
import { useProductSearch } from '@/hooks/useProducts';

function SearchComponent() {
  const { products, loading, searchProducts } = useProductSearch();
  
  const handleSearch = () => {
    searchProducts({
      keyword: 'nike',
      min_price: 100,
      max_price: 500,
      status: 'IN_STOCK'
    });
  };
}
```

## Known Issues & Considerations

### Cookie Authentication
- Ensure CORS is properly configured on the backend
- HTTP-only cookies require same-origin or proper CORS setup
- Consider domain/subdomain configuration for production

### Image Handling
- Product images are served from the PHP backend
- Image URLs are constructed using the API base URL
- Ensure proper image storage and serving configuration

### Error Handling
- All API errors are wrapped in a consistent `ApiError` class
- Validation errors are properly extracted and displayed
- Network errors are handled gracefully

## Next Steps

1. **Admin Integration**: Update admin pages to use the new API
2. **Categories**: Add category management if needed
3. **Orders**: Implement order management system
4. **Real-time Updates**: Consider WebSocket integration for real-time updates
5. **Caching**: Implement proper caching strategies
6. **Testing**: Add comprehensive API integration tests

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS configuration allows your frontend domain
2. **Cookie Issues**: Check domain/path configuration in backend cookie settings
3. **Image Loading**: Verify image URLs and backend static file serving
4. **Authentication**: Check JWT configuration and cookie settings

### Debug Tips

- Use browser DevTools Network tab to inspect API calls
- Check browser Application tab for cookie storage
- Enable backend API logging for debugging
- Use the browser console for client-side error details
