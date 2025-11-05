# Mateflow Platform Admin

A modern admin platform built with Umi 4 (UmiJS Max), React, TypeScript, and Ant Design.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the environment template and configure your settings:

```bash
# Copy the template
cp env.example .env

# Edit .env with your configuration
# Set UMI_APP_API_BASE_URL to your backend API URL
```

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration options.

### 3. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:8000` in your browser.

### 4. Build for Production

```bash
pnpm build
```

## 📚 Documentation

### Configuration

- **[ENV_SETUP.md](./ENV_SETUP.md)** - Environment variables configuration guide
- **[OPENAPI_BASE_URL_SOLUTION.md](./OPENAPI_BASE_URL_SOLUTION.md)** - API base URL configuration solution

### OpenAPI Integration

- **[docs/OPENAPI_SETUP.md](./docs/OPENAPI_SETUP.md)** - OpenAPI code generation setup
- **[src/services/README.md](./src/services/README.md)** - Generated API services usage
- **[openapi-config-note.md](./openapi-config-note.md)** - Quick reference for OpenAPI config

### Security & Authentication

- **[docs/AUTH_DOCS_INDEX.md](./docs/AUTH_DOCS_INDEX.md)** - Authentication documentation index
- **[docs/SECURITY_FEATURES.md](./docs/SECURITY_FEATURES.md)** - Security features overview
- **[docs/CLOUDFLARE_TURNSTILE_GUIDE.md](./docs/CLOUDFLARE_TURNSTILE_GUIDE.md)** - CAPTCHA setup guide

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Alias for `pnpm dev`
- `pnpm openapi` - Regenerate API client code from OpenAPI specification
- `pnpm format` - Format code with Prettier

## 🏗️ Tech Stack

- **Framework**: [Umi 4 (UmiJS Max)](https://umijs.org/docs/max/introduce)
- **UI Library**: [Ant Design 5](https://ant.design/)
- **Language**: TypeScript
- **API Client**: Auto-generated from OpenAPI spec using [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)
- **State Management**: Umi Model
- **Authentication**: JWT with refresh token support
- **Security**: CAPTCHA (Cloudflare Turnstile), rate limiting, session management

## 📁 Project Structure

```
mateflow-platform-admin/
├── docs/                    # Documentation
├── src/
│   ├── config/             # Configuration modules
│   │   └── api.ts          # API configuration (environment-based)
│   ├── components/         # Reusable React components
│   ├── pages/              # Application pages
│   ├── services/           # Auto-generated API services
│   ├── models/             # Umi models (state management)
│   ├── utils/              # Utility functions
│   ├── layouts/            # Layout components
│   └── app.tsx             # Runtime configuration
├── .env                    # Environment variables (create from env.example)
├── env.example             # Environment variables template
├── .umirc.ts               # Umi configuration
├── openapi.json            # OpenAPI specification
└── package.json            # Project dependencies
```

## 🔐 Environment Variables

### Required Variables

```bash
# API Base URL
UMI_APP_API_BASE_URL=http://localhost:8080

# Captcha (Cloudflare Turnstile)
UMI_APP_TURNSTILE_SITE_KEY=mock  # Use 'mock' for development
```

See [ENV_SETUP.md](./ENV_SETUP.md) for complete list and setup instructions.

## 🔄 Regenerating API Code

When your backend OpenAPI specification changes:

1. Update `openapi.json` with the new spec
2. Run the code generator:
   ```bash
   pnpm run openapi
   ```
3. The API client code will be regenerated in `src/services/`
4. Your configuration remains intact! ✅

See [OPENAPI_BASE_URL_SOLUTION.md](./OPENAPI_BASE_URL_SOLUTION.md) for how this works.

## 📖 More Information

For more features and documentation, refer to:

- [Umi Max 简介](https://umijs.org/docs/max/introduce)
- [Ant Design Documentation](https://ant.design/)
- Project documentation in the `docs/` directory
