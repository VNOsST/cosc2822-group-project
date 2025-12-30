# Contributing to CineCloud

Thank you for your interest in contributing to CineCloud! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain professional communication

## Getting Started

### Prerequisites

1. Install required tools:

   - [Bun](https://bun.sh)
   - [Docker](https://www.docker.com/)
   - [Git](https://git-scm.com/)

2. Fork the repository

3. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/cosc2822-group-project.git
cd cosc2822-group-project
```

4. Add upstream remote:

```bash
git remote add upstream https://github.com/VNOsST/cosc2822-group-project.git
```

5. Follow the [Quick Start Guide](../guides/QUICK_START.md)

## Development Workflow

### 1. Create a Branch

Follow our [Branching Strategy](../development/BRANCHING_STRATEGY.md):

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow existing patterns
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Backend
cd backend
bun run lint
bun test

# Frontend
cd frontend
bun run lint
bun test

# Database
cd database
bun run lint
```

### 4. Commit Your Changes

Follow our [Commit Convention](../development/COMMIT_CONVENTION.md):

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` type
- Use strict mode

```typescript
// Good
interface User {
  id: string
  name: string
  email: string
}

// Avoid
const user: any = { ... }
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Code Organization

```typescript
// 1. Imports (grouped and sorted)
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface Props {
  userId: string;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Component/Function
export function UserProfile({ userId }: Props) {
  // ...
}
```

### Comments

- Use JSDoc for functions
- Explain "why", not "what"
- Keep comments up-to-date

```typescript
/**
 * Validates user booking request
 * Checks seat availability and user permissions
 * @param bookingData - Booking information
 * @returns Validation result
 */
function validateBooking(bookingData: BookingData): ValidationResult {
  // Implementation
}
```

## Commit Guidelines

See [Commit Convention](../development/COMMIT_CONVENTION.md) for details.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```bash
feat(booking): add seat selection validation

fix(api): resolve duplicate booking issue

docs(readme): update installation instructions

refactor(database): optimize query performance
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console logs or debugging code
- [ ] Commits follow convention
- [ ] Branch is up-to-date with main

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How to test the changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### Review Process

1. Create PR with clear description
2. Request reviews from team members
3. Address feedback
4. Get approval from at least one reviewer
5. Merge when approved

## Testing Guidelines

### Unit Tests

```typescript
// Test file: user-service.test.ts
import { describe, expect, test } from "bun:test";
import { getUserById } from "./user-service";

describe("getUserById", () => {
  test("returns user when found", async () => {
    const user = await getUserById("valid-id");
    expect(user).toBeDefined();
    expect(user.id).toBe("valid-id");
  });

  test("throws error when not found", async () => {
    expect(getUserById("invalid-id")).rejects.toThrow();
  });
});
```

### Integration Tests

Test API endpoints end-to-end:

```typescript
test("create booking endpoint", async () => {
  const response = await fetch("http://localhost:3001/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.booking_id).toBeDefined();
});
```

### Test Coverage

Aim for:

- Minimum 70% code coverage
- All critical paths tested
- Edge cases covered

## Documentation

### Code Documentation

- Use JSDoc/TSDoc for functions
- Add README for new modules
- Update API documentation

### Architecture Documentation

When adding new features:

- Update architecture diagrams
- Document new patterns
- Add to API reference

## Getting Help

- Check existing documentation
- Ask in team chat
- Create GitHub issue
- Reach out to maintainers

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Credited in release notes
- Acknowledged in project README

## License

By contributing, you agree that your contributions will be licensed under the project's ISC License.

---

**Thank you for contributing to CineCloud! 🎬**
