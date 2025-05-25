# Dodo Backend

A Node.js backend service for managing dodo :)

## Project Structure
```
src/
├── app.ts # Express app setup
├── server.ts # Server entry point
├── config/ # Configuration files
│ └── index.ts # Environment config
├── controllers/ # Route controllers
│ ├── block/ # Block management
│ │ ├── blockController.ts
│ │ └── tests/
│ └── dodoPage/ # Page management
│   └── dodoPageController.ts
├── models/ # Mongoose models
│ ├── block/
│ │ ├── model.ts # Block models
│ │ └── schema.ts # Block schemas
│ └── index.ts
├── routes/ # Express routes
│ ├── block.ts
│ └── dodoPage.ts
├── middleware/ # Custom middleware
│ ├── fileUpload.ts
│ └── errorHandler.ts
├── utils/ # Utility functions
│ ├── logger.ts
│ └── fileManager.ts
├── types/ # TypeScript types
│ ├── block.ts
│ ├── dodoPage.ts
│ └── common.ts
└── test/ # Test configuration
└── setup.ts
```
## Prerequisites

- Node.js (v16+)
- MongoDB
- pnpm (recommended) or npm

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dodoclub18/dodo_Backend.git
   cd dodo_Backend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Create environment files:**

   `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/dodopage
   NODE_ENV=development
   JWT_SECRET=your-secret-key
   UPLOAD_DIR=uploads
   BASE_URL=http://localhost:3000
   ```

## Development

- **Start the development server:**
  ```bash
  pnpm dev
  ```

- **Build the project:**
  ```bash
  pnpm build
  ```

- **Start production server:**
  ```bash
  pnpm start
  ```

## Testing

The project uses Jest with MongoDB Memory Server for testing.


- **Run docker compose up to start the test database:**
```bash
docker compose up
```

- **Run all tests:**
  ```bash
  pnpm test
  ```

- **Run tests in watch mode:**
  ```bash
  pnpm test:watch
  ```

- **Generate test coverage:**
  ```bash
  pnpm test:coverage
  ```

## API Endpoints

### Blocks

- **POST `/api/v1/block/create`** - Create a new block
  - Supports file uploads for images
  - Handles different block types (Link, Poll, Product, Heading)

- **PATCH `/api/v1/block/update/:blockId`** - Update an existing block
  - Can update block content and metadata
  - Supports file updates

- **POST `/api/v1/block/reorder`** - Reorder blocks
  - Uses transactions in production for data consistency
  - Accepts array of block IDs with new positions

- **DELETE `/api/v1/block/delete/:blockId`** - Delete a block
  - Removes associated files
  - Updates parent DodoPage

### DodoPage

- **POST `/api/v1/dodopage/create`** - Create a new page
- **PATCH `/api/v1/dodopage/update/:id`** - Update page
- **GET `/api/v1/dodopage/:id`** - Get page details

## File Handling

### Supported file types:
- Images (jpg, jpeg, png)
- Audio (mp3, wav)

### File upload configuration:
- Maximum file size: 10MB
- Storage: Local filesystem
- Custom file filter for type validation

## Error Handling

The application uses a centralized error handling system:
- Request validation errors
- File upload errors
- Database errors
- Authentication errors

Errors are logged using Winston logger and return appropriate HTTP status codes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Tag the commit for pushing to a particular environment (`git tag production-v1.0` or `git tag development-v1.0`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request
