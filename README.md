# Video Downloader Front-End

A modern, full-featured React web application for downloading and managing videos from various online platforms. Features include video search, scheduled downloads, real-time progress monitoring, watch history tracking, and a comprehensive video library management system.

## Features

- **Video Library** - Browse, search, and filter your downloaded video collection
- **Advanced Search** - Filter by duration, file size, video site, and sort options
- **Scheduled Downloads** - Queue video downloads from external URLs
- **Real-time Progress** - Monitor download progress with live updates via EventSource
- **Watch History** - Track viewing progress with timestamp bookmarks
- **Video Playback** - Stream videos with playback position persistence
- **Metadata Management** - View and edit video metadata and thumbnails
- **Theme Support** - Light and dark mode with smooth transitions
- **Authentication** - Secure login with token-based authentication

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 19, React Router 7 |
| **Language** | TypeScript 5.8 |
| **Build Tool** | Vite 7 |
| **UI Library** | Material-UI (MUI) 7 |
| **Styling** | Sass/SCSS, Emotion |
| **HTTP Client** | Axios |
| **Validation** | Zod 4 |
| **Date/Time** | Luxon |
| **Testing** | Vitest, jsdom |
| **Deployment** | Docker, AWS CDK |

## Prerequisites

- Node.js LTS (v20+)
- npm
- Docker (optional, for containerized deployment)

## Installation

```bash
# Clone the repository
git clone https://github.com/ruchira088/video-downloader-front-end.git
cd video-downloader-front-end

# Install dependencies
npm ci
```

## Development

### Start Development Server

```bash
# Start with default API endpoint
npm run start

# Start with local API endpoint
npm run start:local

# Start without build metadata generation
npm run start:dev
```

The development server runs at `http://localhost:5173`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start dev server with production API |
| `npm run start:local` | Start dev server with local API |
| `npm run start:dev` | Start dev server without env vars |
| `npm run build` | Build for production |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run typecheck` | Run TypeScript type checking |

## Configuration

### Environment Variables

Build-time environment variables are auto-generated via `scripts/env-vars.mjs`:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API endpoint |
| `VITE_GIT_BRANCH` | Current git branch |
| `VITE_GIT_COMMIT` | Git commit hash |
| `VITE_BUILD_TIMESTAMP` | Build timestamp |

### API Configuration

The application determines the backend API URL through:

1. **Query Parameter** - `?API_URL=https://your-api.com`
2. **Environment Variable** - `VITE_API_URL`
3. **Host Mapping** - Predefined domain mappings
4. **Auto-inference** - `${protocol}//api.${host}`

### Application Settings

User preferences stored in localStorage:

- **Theme** - `light` or `dark`
- **Safe Mode** - Toggle for restricted content

## Project Structure

```
video-downloader-front-end/
├── app/                    # Application source code
│   ├── components/         # Reusable React components
│   ├── pages/              # Route-level page components
│   │   ├── authenticated/  # Protected routes
│   │   └── unauthenticated/# Public routes
│   ├── services/           # API clients and business logic
│   ├── models/             # Zod schemas and TypeScript types
│   ├── types/              # Custom type utilities
│   ├── utils/              # Helper functions
│   ├── providers/          # React Context providers
│   └── routes.ts           # Route definitions
├── tests/                  # Test files
├── public/                 # Static assets
├── playbooks/              # Ansible deployment playbooks
│   └── docker/             # Docker configuration
├── cdk-deploy/             # AWS CDK infrastructure
├── scripts/                # Build scripts
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
└── tsconfig.json           # TypeScript configuration
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Videos | Browse and search video library |
| `/video/:videoId` | Video Page | View video details and playback |
| `/history` | History | Watch history and progress |
| `/schedule` | Schedule | Schedule new downloads |
| `/downloading` | Downloading | Monitor active downloads |
| `/service-information` | Service Info | System status and info |
| `/sign-in` | Login | User authentication |

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

Tests use Vitest with jsdom for DOM simulation. Test files are located in the `tests/` directory.

## Building for Production

```bash
npm run build
```

The optimized build output is generated in the `build/` directory.

## Docker Deployment

### Build Docker Image

```bash
docker build -f playbooks/docker/Dockerfile -t video-downloader-front-end .
```

### Run Container

```bash
docker run -p 5173:5173 video-downloader-front-end
```

### Multi-architecture Build

The project includes Ansible playbooks for building multi-architecture images (`linux/arm64` and `linux/amd64`) and publishing to GitHub Container Registry.

## AWS Deployment

Infrastructure is managed via AWS CDK in the `cdk-deploy/` directory.

```bash
cd cdk-deploy
npm install
npm run cdk deploy
```

## Architecture

### Services

- **AuthenticationService** - Login/logout, token management
- **VideoService** - Video CRUD operations, search, metadata
- **SchedulingService** - Download scheduling, progress tracking
- **HistoryService** - Watch history and playback positions
- **ConfigService** - Application configuration and preferences

### Data Models

All data models use Zod for runtime validation with automatic TypeScript type inference:

- `Video` - Video entity with metadata
- `ScheduledVideoDownload` - Download queue items
- `VideoMetadata` - Extended video information
- `User` - User profile data
- `AuthenticationToken` - JWT token data

### Custom Types

- `Option<T>` - Functional optional type with map/fold
- `Either<E, A>` - Error handling with left/right values

## Related Projects

This frontend works with a backend API service. Ensure the backend is running and accessible at the configured API URL.

## License

[MIT](LICENSE)
