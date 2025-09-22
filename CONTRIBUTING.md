# Contributing to UPI Mini Gateway

Thank you for your interest in contributing to UPI Mini Gateway! This document provides guidelines and information for contributors.

## 🤝 Welcome Contributors

We're excited to have you contribute to this project! Whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements, your contributions are valuable.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contribution Guidelines](#contribution-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

---

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, trolling, or insulting comments
- Personal or political attacks
- Publishing others' private information without permission
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project maintainer at [hello@techsci.io](mailto:hello@techsci.io).

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control
- **MongoDB Atlas** account (for database testing)
- **Basic knowledge** of React, TypeScript, Node.js, and Express

### Quick Start

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/UPI_MINI_GATEWAY.git
   cd UPI_MINI_GATEWAY
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/code-craka/UPI_MINI_GATEWAY.git
   ```

3. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

4. **Set Up Environment**
   ```bash
   # Copy environment files
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env.local
   ```

---

## 🔧 Development Setup

### Local Development Environment

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

#### Backend Setup
```bash
cd backend
npm install
npm run build
npm run dev  # Starts on http://localhost:5000
```

#### Database Setup
1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGO_URI` in `backend/.env.local`

### Development Tools

#### Recommended VS Code Extensions
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **ESLint**
- **Prettier**
- **Thunder Client** (for API testing)
- **MongoDB for VS Code**

#### Required Tools
```bash
# Install development tools globally
npm install -g typescript
npm install -g eslint
npm install -g @types/node
```

---

## 📝 Contribution Guidelines

### Types of Contributions

We welcome the following types of contributions:

#### 🐛 Bug Reports
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)

#### ✨ Feature Requests
- Clear description of the proposed feature
- Use case and rationale
- Potential implementation approach
- Consider backward compatibility

#### 🔧 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring
- Test improvements

#### 📖 Documentation
- README improvements
- API documentation
- Code comments
- Examples and tutorials
- Translation contributions

### Contribution Workflow

1. **Check existing issues** before starting work
2. **Create an issue** for discussion (for significant changes)
3. **Fork the repository** and create a feature branch
4. **Make your changes** following coding standards
5. **Write/update tests** for your changes
6. **Update documentation** as needed
7. **Submit a pull request** with clear description

---

## 🔄 Pull Request Process

### Before Submitting

#### Pre-submission Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex code sections
- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] All tests pass locally
- [ ] No merge conflicts with main branch

#### Branch Naming
```bash
feature/payment-webhook-integration
fix/jwt-token-expiration
docs/api-documentation-update
refactor/payment-flow-optimization
```

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots/Videos
Include if UI changes are involved.

## Additional Notes
Any additional information for reviewers.
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: Maintainer reviews within 48 hours
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, changes are merged
5. **Cleanup**: Delete feature branch after merge

---

## 🎨 Coding Standards

### TypeScript/JavaScript Standards

#### Code Style
```typescript
// ✅ Good
interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
}

const processPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Implementation
};

// ❌ Bad
const processPayment = (amount, currency, orderId) => {
  // No types, unclear parameters
};
```

#### Naming Conventions
- **Variables/Functions**: camelCase (`processPayment`, `orderId`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `JWT_SECRET`)
- **Components**: PascalCase (`PaymentForm`, `OrderSummary`)
- **Files**: kebab-case (`payment-form.tsx`, `order-service.ts`)

#### Import Organization
```typescript
// 1. Node modules
import React from 'react';
import axios from 'axios';

// 2. Internal modules
import { PaymentService } from '../services/payment-service';
import { OrderType } from '../types/order';

// 3. Relative imports
import './PaymentForm.css';
```

### React Component Standards

#### Functional Components
```typescript
interface PaymentFormProps {
  onSubmit: (data: PaymentData) => void;
  loading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  loading = false
}) => {
  // Component implementation
};
```

#### Custom Hooks
```typescript
export const usePayment = () => {
  const [loading, setLoading] = useState(false);

  const processPayment = useCallback(async (data: PaymentData) => {
    // Implementation
  }, []);

  return { loading, processPayment };
};
```

### Backend Standards

#### API Endpoints
```typescript
// ✅ Good
router.post('/api/v1/payments', validatePayment, async (req, res) => {
  try {
    const result = await paymentService.processPayment(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

#### Error Handling
```typescript
class PaymentError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
```

---

## 🧪 Testing Guidelines

### Frontend Testing

#### Unit Tests (Jest + React Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentForm } from './PaymentForm';

describe('PaymentForm', () => {
  it('should submit payment data', () => {
    const onSubmit = jest.fn();
    render(<PaymentForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '100' }
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ amount: 100 });
  });
});
```

#### Integration Tests
```typescript
describe('Payment Flow Integration', () => {
  it('should complete payment process', async () => {
    // Test complete payment flow
  });
});
```

### Backend Testing

#### API Tests
```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/v1/payments', () => {
  it('should create payment', async () => {
    const response = await request(app)
      .post('/api/v1/payments')
      .send({
        amount: 100,
        currency: 'INR',
        orderId: 'test-order-1'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

### Test Commands
```bash
# Frontend tests
cd frontend
npm test
npm run test:coverage

# Backend tests
cd backend
npm test
npm run test:integration
```

---

## 📖 Documentation

### Code Documentation

#### Function Documentation
```typescript
/**
 * Processes a UPI payment request
 * @param request - Payment request data
 * @param options - Additional processing options
 * @returns Promise resolving to payment response
 * @throws PaymentError when validation fails
 */
async function processPayment(
  request: PaymentRequest,
  options: PaymentOptions = {}
): Promise<PaymentResponse> {
  // Implementation
}
```

#### API Documentation
All API endpoints should be documented with:
- Purpose and description
- Request/response schemas
- Error codes and messages
- Usage examples

### Documentation Standards
- Use clear, concise language
- Include practical examples
- Keep documentation up-to-date with code changes
- Use proper markdown formatting

---

## 🐛 Issue Reporting

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
Add screenshots if applicable.

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Node.js: [e.g., 18.12.0]
- Project Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information.
```

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Any other relevant information, mockups, or examples.
```

---

## 💬 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussions and questions
- **Email**: [hello@techsci.io](mailto:hello@techsci.io) for private matters

### Getting Help

1. **Check Documentation**: README, docs/, and code comments
2. **Search Issues**: Look for existing similar issues
3. **Ask Questions**: Create a discussion or issue
4. **Join Community**: Engage with other contributors

### Recognition

Contributors will be recognized in:
- **Contributors section** in README.md
- **Release notes** for significant contributions
- **GitHub contributor graph**
- **Special mentions** in project updates

---

## 🚀 Development Workflow

### Daily Development

1. **Sync with upstream**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new payment method support"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### Code Quality Checks

```bash
# Lint code
npm run lint

# Type checking
npm run type-check

# Run tests
npm test

# Build project
npm run build
```

---

## 🏆 Contributor Levels

### Contributor Recognition

#### New Contributor
- First-time contributors
- Welcome package and guidance
- Simple "good first issue" assignments

#### Regular Contributor
- Multiple accepted PRs
- Trusted with medium complexity issues
- Code review participation

#### Core Contributor
- Significant project contributions
- Commit access consideration
- Architecture decision input

#### Maintainer
- Project leadership role
- Full repository access
- Release management

---

## 📞 Contact

### Project Maintainer

**Sayem Abdullah Rihan**
- **GitHub**: [@code-craka](https://github.com/code-craka)
- **Email**: [hello@techsci.io](mailto:hello@techsci.io)
- **Response Time**: Usually within 24-48 hours

### Reporting Security Issues

For security-related issues, please email directly to [hello@techsci.io](mailto:hello@techsci.io) instead of creating public issues.

---

## 🙏 Thank You

Thank you for contributing to UPI Mini Gateway! Your efforts help make this project better for everyone. We appreciate your time, expertise, and dedication to the open-source community.

### Special Thanks

We extend our gratitude to all contributors who have helped shape this project:
- Code contributors
- Documentation writers
- Bug reporters
- Feature requesters
- Community supporters

---

**Happy Contributing! 🚀**

*Built with ❤️ by the UPI Mini Gateway community*