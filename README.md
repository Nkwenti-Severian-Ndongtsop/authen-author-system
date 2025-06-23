# Authentication & Authorization System

A modern authentication and authorization system with a TypeScript frontend and OpenAPI-generated client.

## Project Structure

```
authen-author-system/
├── frontend/           # Frontend application (Vite + TypeScript)
├── ts-client/         # Generated TypeScript API client
├── openapi.json       # OpenAPI specification
└── openapitools.json  # OpenAPI generator configuration
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nkwenti-Severian-Ndongtsop/authen-author-system.git
   cd authen-author-system
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Set up the TypeScript API client**
   ```bash
   cd ts-client
   npm install
   npm run build
   cd ..
   ```

4. **Set up the frontend application**
   ```bash
   cd frontend
   npm install
   ```

## Development

1. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

2. **Rebuild the TypeScript client** (after API changes)
   ```bash
   npm run generate-client  # From the root directory
   cd ts-client
   npm run build
   ```

## Features

- Modern login/signup interface
- TypeScript support
- SCSS styling with variables and nested rules
- OpenAPI-generated TypeScript client
- Vite-powered development environment

## Project Configuration

### Frontend (Vite)
- TypeScript and SCSS support
- Hot Module Replacement (HMR)
- Optimized build process
- Alias configuration for clean imports

### TypeScript Client
- Generated from OpenAPI specification
- Type-safe API interactions
- Axios-based HTTP client
- ESM module support

## Development Guidelines

1. **API Changes**
   - Update the `openapi.json` specification
   - Regenerate the TypeScript client
   - Rebuild the client before testing

2. **Frontend Development**
   - Follow TypeScript best practices
   - Use SCSS variables for consistent styling
   - Maintain responsive design principles

3. **Version Control**
   - Commit source files and configurations
   - Exclude built files and dependencies (see .gitignore)
   - Keep package-lock.json files for dependency consistency

## Troubleshooting

### Common Issues

1. **Module Resolution Problems**
   - Ensure the TypeScript client is built (`npm run build` in ts-client)
   - Check import paths use the configured alias (@auth/ts-client)
   - Verify Vite configuration is correct

2. **Build Errors**
   - Clear the dist directories
   - Rebuild the TypeScript client
   - Check for TypeScript errors

### Development Tips

- Use `npm run dev` for hot-reload development
- Check the browser console for errors
- Verify API endpoints in the OpenAPI specification

## License

[Add your license information here]