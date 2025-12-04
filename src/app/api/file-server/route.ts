// mock file server API to read an example employee developer handbook
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("filePath");
  if (!filePath) {
    return new Response("File path is required", { status: 400 });
  }

  // mock file content
  const fileContent = `
# Employee Developer Handbook

## Introduction

Welcome to the company! This handbook is designed to help you get started as a Fullstack Developer. This guide covers everything you need to know about your role, the tech stack we use, and how to set up your development environment.

## Role Overview

As a Fullstack Developer, you'll be working on both frontend and backend development, building scalable web applications using modern JavaScript technologies. You'll collaborate with cross-functional teams to deliver high-quality software solutions.

### Key Responsibilities

- Develop and maintain web applications using React, Next.js, and TypeScript
- Build and maintain RESTful APIs using Node.js
- Write clean, maintainable, and well-documented code
- Participate in code reviews and contribute to technical discussions
- Collaborate with designers, product managers, and other developers
- Debug and troubleshoot issues across the stack
- Write unit and integration tests

## Tech Stack

Our primary technology stack includes:

- **Frontend Framework**: React 18+
- **Fullstack Framework**: Next.js 14+ (App Router)
- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript 5+
- **Package Manager**: npm
- **Styling**: Tailwind CSS / CSS Modules
- **State Management**: React Context API / Zustand
- **API**: RESTful APIs / Next.js API Routes

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js and npm**
   - Install Node.js LTS version (18.x or higher) from [nodejs.org](https://nodejs.org/)
   - npm comes bundled with Node.js
   - Verify installation:
     \`\`\`bash
     node --version  # Should be v18.x.x or higher
     npm --version   # Should be 9.x.x or higher
     \`\`\`

2. **Code Editor**
   - Recommended: Visual Studio Code
   - Install VS Code extensions:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features
     - Tailwind CSS IntelliSense (if using Tailwind)

3. **Git**
   - Install Git from [git-scm.com](https://git-scm.com/)
   - Configure your Git identity:
     \`\`\`bash
     git config --global user.name "Your Name"
     git config --global user.email "your.email@company.com"
     \`\`\`

### Initial Setup Steps

1. **Clone the Repository**
   \`\`\`bash
   git clone <repository-url>
   cd <project-name>
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables**
   - Copy \`.env.example\` to \`.env.local\`
   - Fill in the required environment variables
   - Never commit \`.env.local\` to version control

4. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   - The application will be available at \`http://localhost:3000\`

5. **Run Type Checking**
   \`\`\`bash
   npm run type-check
   \`\`\`

6. **Run Linting**
   \`\`\`bash
   npm run lint
   \`\`\`

## Project Structure

Our Next.js projects follow this structure:

\`\`\`
project-root/
├── src/
│   ├── app/              # Next.js App Router pages and routes
│   │   ├── api/          # API routes (backend)
│   │   ├── (routes)/     # Route groups
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable React components
│   │   ├── ui/           # UI components (buttons, inputs, etc.)
│   │   └── features/     # Feature-specific components
│   ├── lib/              # Utility functions and helpers
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # React Context providers
│   └── styles/           # Global styles
├── public/               # Static assets
├── .env.local           # Environment variables (gitignored)
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Dependencies and scripts
\`\`\`

## Development Workflow

### Daily Workflow

1. **Pull Latest Changes**
   \`\`\`bash
   git pull origin main
   npm install  # If dependencies changed
   \`\`\`

2. **Create a Feature Branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

3. **Make Changes**
   - Write code following our coding standards
   - Write tests for new features
   - Ensure TypeScript types are correct
   - Run linting and type checking

4. **Commit Changes**
   \`\`\`bash
   git add .
   git commit -m "feat: add new feature description"
   \`\`\`
   - Use conventional commits: \`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`, etc.

5. **Push and Create Pull Request**
   \`\`\`bash
   git push origin feature/your-feature-name
   \`\`\`

### Code Quality Standards

- **TypeScript**: All code must be properly typed
- **ESLint**: Code must pass linting without errors
- **Prettier**: Code must be formatted consistently
- **Testing**: New features require unit tests
- **Documentation**: Complex logic must be documented

## Common Development Tasks

### Creating a New Page

1. Create a new file in \`src/app/\` directory:
   \`\`\`typescript
   // src/app/about/page.tsx
   export default function AboutPage() {
     return <div>About Page</div>;
   }
   \`\`\`

2. The route will be available at \`/about\`

### Creating an API Route

1. Create a route handler in \`src/app/api/\`:
   \`\`\`typescript
   // src/app/api/users/route.ts
   import { NextResponse } from 'next/server';

   export async function GET() {
     return NextResponse.json({ users: [] });
   }
   \`\`\`

2. The API will be available at \`/api/users\`

### Creating a Reusable Component

1. Create component file:
   \`\`\`typescript
   // src/components/ui/Button.tsx
   interface ButtonProps {
     children: React.ReactNode;
     onClick?: () => void;
   }

   export function Button({ children, onClick }: ButtonProps) {
     return (
       <button onClick={onClick} className="btn-primary">
         {children}
       </button>
     );
   }
   \`\`\`

2. Use in your pages:
   \`\`\`typescript
   import { Button } from '@/components/ui/Button';
   \`\`\`

## npm Scripts

Common npm scripts you'll use:

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run type-check\` - Run TypeScript type checking
- \`npm run test\` - Run tests
- \`npm run format\` - Format code with Prettier

## Best Practices

### TypeScript

- Always define types for function parameters and return values
- Use interfaces for object shapes
- Avoid \`any\` type - use \`unknown\` if type is truly unknown
- Leverage TypeScript's utility types (\`Partial\`, \`Pick\`, \`Omit\`, etc.)

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper key props in lists
- Avoid unnecessary re-renders with \`React.memo\` when needed

### Next.js

- Use Server Components by default
- Use Client Components (\`'use client'\`) only when needed
- Leverage Next.js Image component for images
- Use dynamic imports for code splitting
- Implement proper error boundaries

### Node.js / API Development

- Use async/await instead of callbacks
- Handle errors properly with try/catch
- Validate input data
- Use proper HTTP status codes
- Implement rate limiting for public APIs

## Troubleshooting

### Common Issues

**Port Already in Use**
\`\`\`bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

**Module Not Found**
- Run \`npm install\` to ensure all dependencies are installed
- Check that the import path is correct
- Verify the file exists in the expected location

**TypeScript Errors**
- Run \`npm run type-check\` to see all type errors
- Ensure all types are properly imported
- Check \`tsconfig.json\` for path aliases configuration

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [npm Documentation](https://docs.npmjs.com)

## Getting Help

- **Technical Questions**: Reach out to your team lead or senior developers
- **Setup Issues**: Check with DevOps or IT support
- **Code Reviews**: Request reviews from at least one team member before merging

## Next Steps

1. Complete your development environment setup
2. Review the codebase and familiarize yourself with the project structure
3. Set up your IDE with recommended extensions
4. Complete your first small task or bug fix
5. Attend team meetings and standups

Welcome aboard, and happy coding!
  `;

  return new Response(fileContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}
