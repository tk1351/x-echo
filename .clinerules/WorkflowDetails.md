# Workflow Details

## Branch Strategy

### 1. Basic Rules

- Always develop on feature branches
- Keep the main branch in a stable state
- Implement features and fix bugs on separate branches

### 2. Branch Naming Conventions

- Feature addition: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Refactoring: `refactor/description`
- Documentation: `docs/description`
- Configuration changes: `chore/description`

### 3. Work Start Procedure (REQUIRED)

1. ALWAYS create a new branch from the latest main branch
   ```bash
   git switch main
   git pull origin main
   git switch -c feature/feature-name
   ```

## Commit Message Conventions

### 1. Basic Structure

<type>(<scope>): <subject>

<body>

<footer>

# Prompt History
<prompt_history>

### 2. Description of Elements

#### type

- feature: New feature
- fix: Bug fix
- docs: Documentation only changes
- style: Changes that don't affect code meaning (whitespace, formatting, adding semicolons, etc.)
- refactor: Code changes that neither fix bugs nor add features
- test: Adding or correcting tests
- chore: Changes to build processes or auxiliary tools and libraries

#### scope

- Indicates the scope of influence of the change
- Separate with commas if there are multiple scopes
- Optional for global changes

#### subject

- Concise summary of the change

#### body

- Detailed explanation of the change
- Can be described in multiple lines with line breaks
- Explanation of why the change was necessary
- Line break at 72 characters

#### prompt_history

- Record of prompts instructed by the user
- Include additional context information related to the prompt

### 3. Commit Message Example

feature(tweets): Add tweet posting functionality

- Implement tweet posting functionality
- Add validation for posting

# Prompt History

1. Q: Please implement tweet posting functionality
  A: Implemented tweet posting functionality and added validation for posting conditions

### 4. Commit Message Command Restrictions

- If a commit message is created, do not execute the command
- Provide only the created message content as the answer
- Commands must always be executed manually by the user

### 5. Regular Commit Practices

- Make small, frequent commits to track changes effectively
- Always output commit messages as text before executing git commit
- Commit messages must be descriptive and clearly explain what changes were made
- Include the "why" behind changes when necessary
- Keep related changes together in a single commit
- Separate unrelated changes into different commits
- Review changes before committing using git diff or git status

## Pull Request Creation Conventions

### 1. Basic Rules

- Base branch is fixed to main
- Title and body are written in Japanese

### 2. Creating Title and Body

#### Title
- Concisely summarize the commit content included in the branch
- Format: `Commit type: Summary of changes`
- Example: `feature: Add document review approval function`

#### Body
- Extract key changes from commit history and describe in list format
- Include background and purpose of changes
- Include test execution results and operation verification results

### 4. Using gh Command

# Get current branch name
current_branch=$(git branch --show-current)

# Pull request creation command
gh pr create \
  --base main \
  --head "$current_branch" \
  --title "[Commit type] Summary of changes" \
  --body '## Changes

- Change 1
- Change 2
- Change 3

## Background and Purpose of Changes

- Explanation of background
- Explanation of purpose

## Test Results

- [ ] Unit tests executed
- [ ] Operation verified

### 4. Notes When Requesting Review

- Clearly state points that need special attention
- Add supplementary explanations for complex parts of the code
