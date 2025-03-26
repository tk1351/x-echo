# Testing Practices

## Testing Standards

### Common

- Do not create __tests__ directories
- Create in the same directory as the target file
- Unify file names with .test.ts
- When creating a new test file
  - Refer to the style of existing test code
    - When working in the api directory, refer to test code in the api directory
    - When working in the client directory, refer to test code in the client directory
  - If the same mock appears in multiple files and can be reused, extract it to a separate file
- Prioritize unit testing of pure functions
- Incorporate testability into design
- Use assert-first to work backward from expected results
- If tests continue to fail, report the problem to the user and ask for instructions

### api directory

- Mock parts using Prisma so that they don't access the actual database
- Mock parts dependent on external APIs so that actual requests do not occur
- Run the command "npm run test {target file}"

### client directory

- Use React Testing Library for component testing
- Mock API calls and external dependencies
- Test pure functions and custom hooks separately
- Use Playwright for critical E2E tests
- Maintain high test coverage (90%+ for business logic, 80%+ for UI components)
- Run the command "npm run test {target file}"

## Test-Driven Development (TDD) Basics

### Basic Concepts

Test-Driven Development (TDD) is a development approach that proceeds through the following cycle:

1. **Red**: First, write a failing test
2. **Green**: Implement minimally to make the test pass
3. **Refactor**: Improve the code through refactoring

### Key Concepts

- **Tests are specifications**: Test code expresses the specifications of the implementation
- **Think in Assert-Act-Arrange order**:
  1. First define the expected result (assertion)
  2. Then define the operation (processing of the test target)
  3. Finally define the preparation (setup of the test environment)
- **Test names should be in "situation→operation→result" format**: Example:
  "Should successfully retrieve user information when given a valid token"
