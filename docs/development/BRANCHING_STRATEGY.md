# Branching Strategy

This document outlines the Git branching strategy and workflow to be followed in this project. A clear branching strategy ensures organized development, streamlined collaboration, and efficient release management.

## Overview

This project follows a **simplified Git Flow** model optimized for continuous delivery. All development branches merge directly into `main`, making the workflow straightforward while maintaining code quality through pull requests and reviews.

## Branch Types

### Main Branch

#### `main`

- **Purpose**: Production-ready code and integration branch
- **Protection**: Highly protected, requires pull request reviews
- **Deployment**: Automatically deploys to production
- **Commits**: Only via merge from `feature`, `bugfix`, `release`, or `hotfix` branches
- **Naming**: `main`

### Supporting Branches

#### Feature Branches

- **Purpose**: Develop new features
- **Branch from**: `main`
- **Merge into**: `main`
- **Naming convention**: `feature/<issue-number>-<short-description>`
- **Lifetime**: Temporary, deleted after merge
- **Examples**:
  - `feature/123-user-authentication`
  - `feature/456-dark-mode`
  - `feature/789-payment-integration`

#### Bugfix Branches

- **Purpose**: Fix non-critical bugs
- **Branch from**: `main`
- **Merge into**: `main`
- **Naming convention**: `bugfix/<issue-number>-<short-description>`
- **Lifetime**: Temporary, deleted after merge
- **Examples**:
  - `bugfix/234-login-validation`
  - `bugfix/567-cart-calculation`

#### Release Branches

- **Purpose**: Prepare a new production release
- **Branch from**: `main`
- **Merge into**: `main`
- **Naming convention**: `release/<version>`
- **Lifetime**: Temporary, deleted after merge
- **Examples**:
  - `release/1.0.0`
  - `release/2.1.0`
  - `release/3.0.0-beta.1`

#### Hotfix Branches

- **Purpose**: Fix critical bugs in production
- **Branch from**: `release`
- **Merge into**: `release`
- **Naming convention**: `hotfix/<version>` or `hotfix/<issue-number>-<short-description>`
- **Lifetime**: Temporary, deleted after merge
- **Examples**:
  - `hotfix/1.0.1`
  - `hotfix/987-security-patch`
  - `hotfix/654-critical-crash`

## Workflow

### Feature Development

1. **Create feature branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/123-user-authentication
   ```

2. **Develop and commit**

   ```bash
   git add .
   git commit -m "feat(auth): add login form validation"
   ```

3. **Keep branch updated**

   ```bash
   git checkout main
   git pull origin main
   git checkout feature/123-user-authentication
   git rebase main
   ```

4. **Push and create pull request**

   ```bash
   git push origin feature/123-user-authentication
   # Create PR on GitHub/GitLab/Bitbucket
   ```

5. **After merge, delete branch**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/123-user-authentication
   git push origin --delete feature/123-user-authentication
   ```

### Bugfix Development

1. **Create bugfix branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b bugfix/234-login-validation
   ```

2. **Fix and commit**

   ```bash
   git add .
   git commit -m "fix(auth): correct email validation regex"
   ```

3. **Push and create pull request**

   ```bash
   git push origin bugfix/234-login-validation
   # Create PR to main
   ```

4. **After merge, delete branch**
   ```bash
   git checkout main
   git pull origin main
   git branch -d bugfix/234-login-validation
   git push origin --delete bugfix/234-login-validation
   ```

### Release Process

1. **Create release branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b release/1.0.0
   ```

2. **Finalize release** (version bumps, changelog, documentation)

   ```bash
   # Update version files
   git commit -m "chore(release): bump version to 1.0.0"

   # Update changelog
   git commit -m "docs(changelog): update for version 1.0.0"
   ```

3. **Create pull request to main**

   ```bash
   git push origin release/1.0.0
   # Create PR to main
   ```

4. **After merge, tag the release**

   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main --tags
   ```

5. **Delete release branch**
   ```bash
   git branch -d release/1.0.0
   git push origin --delete release/1.0.0
   ```

### Hotfix Process

1. **Create hotfix branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/1.0.1
   ```

2. **Fix the critical issue**

   ```bash
   git commit -m "fix(auth): resolve critical session vulnerability"
   ```

3. **Update version**

   ```bash
   git commit -m "chore(release): bump version to 1.0.1"
   ```

4. **Create pull request and merge**

   ```bash
   git push origin hotfix/1.0.1
   # Create PR to main, get expedited review
   ```

5. **After merge, tag the hotfix**

   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.1 -m "Hotfix version 1.0.1"
   git push origin main --tags
   ```

6. **Delete hotfix branch**
   ```bash
   git branch -d hotfix/1.0.1
   git push origin --delete hotfix/1.0.1
   ```

## Branch Naming Rules

### Format

```
<type>/<identifier>-<description>
```

### Rules

- Use lowercase and hyphens
- Keep descriptions short (2-4 words)
- Include issue/ticket number when applicable
- Be descriptive but concise

### Examples

✅ **Good**

- `feature/456-oauth-integration`
- `bugfix/789-cart-total-calculation`
- `hotfix/critical-payment-error`
- `release/2.1.0`

❌ **Bad**

- `feature/new-feature` (not descriptive)
- `bugfix/fix` (too generic)
- `my-branch` (no type prefix)
- `feature/add_new_authentication_system_with_oauth2_and_jwt` (too long)

## Pull Request Guidelines

### Creating a Pull Request

1. **Title format**: Follow commit convention

   - `feat(scope): add feature description`
   - `fix(scope): resolve bug description`

2. **Description should include**:

   - Summary of changes
   - Motivation and context
   - Related issue numbers
   - Screenshots (for UI changes)
   - Testing instructions
   - Breaking changes (if any)

3. **Before submitting**:
   - Ensure all tests pass
   - Update documentation
   - Resolve merge conflicts
   - Self-review your code

### PR Template Example

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Release preparation
- [ ] Hotfix

## Related Issues

Closes #123

## How Has This Been Tested?

Describe the tests you ran and how to reproduce them

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have updated the CHANGELOG (if applicable)
```

### Review Process

1. **Code review requirements**:

   - At least one approval required for feature/bugfix
   - At least two approvals for release branches
   - Expedited review for hotfix (one approval minimum)
   - All comments must be resolved
   - CI/CD checks must pass
   - No merge conflicts

2. **Reviewer responsibilities**:
   - Check code quality and standards
   - Verify functionality
   - Test edge cases
   - Suggest improvements
   - Approve or request changes

## Branch Protection Rules

### `main` Branch

- ✅ Require pull request reviews (minimum 1-2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require signed commits (recommended)
- ✅ Include administrators
- ✅ Restrict who can push
- ❌ Allow force pushes
- ❌ Allow deletions

## Best Practices

### Do's ✅

- **Keep branches short-lived**: Merge frequently to avoid large, complex merges
- **Update regularly**: Sync with main often to minimize conflicts
- **Write descriptive names**: Make branch purpose clear from the name
- **Delete merged branches**: Clean up after merging to keep repository tidy
- **Use draft PRs**: For work in progress to get early feedback
- **Rebase before merging**: Keep history clean (when appropriate)
- **Tag releases**: Always tag releases with semantic versioning
- **Document changes**: Update CHANGELOG.md with each release
- **Test thoroughly**: Ensure all tests pass before creating PR

### Don'ts ❌

- **Don't commit directly to main**: Always use pull requests
- **Don't use generic names**: Avoid names like "fix", "update", "changes"
- **Don't mix concerns**: One branch should address one feature/bug
- **Don't leave branches open**: Close or delete stale branches
- **Don't force push to shared branches**: Can cause issues for other developers
- **Don't ignore conflicts**: Resolve them promptly
- **Don't skip code reviews**: Reviews improve code quality
- **Don't merge broken code**: Ensure CI passes before merging

## Conflict Resolution

### When Conflicts Occur

1. **Update your branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch
   git rebase main
   ```

2. **Resolve conflicts**

   - Open conflicting files
   - Look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
   - Choose or merge changes
   - Remove conflict markers

3. **Test and commit**
   ```bash
   git add .
   git rebase --continue
   git push origin feature/your-branch --force-with-lease
   ```

### Prevention

- Pull from main frequently
- Communicate with team about overlapping work
- Keep changes focused and small
- Merge feature branches promptly

## Versioning

Follow [Semantic Versioning](https://semver.org/) (SemVer):

### Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes (breaking changes)
- **MINOR**: Add functionality in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

### Examples

- `1.0.0` → First stable release
- `1.1.0` → New feature added
- `1.1.1` → Bug fix
- `2.0.0` → Breaking change
- `2.0.0-alpha.1` → Pre-release version

### Pre-release Tags

- `alpha`: Early testing version
- `beta`: Feature complete, but may have bugs
- `rc`: Release candidate

## CI/CD Integration

### Automated Checks

Each branch should trigger:

1. **On push to feature/bugfix/hotfix**:

   - Linting
   - Unit tests
   - Code coverage
   - Security scanning

2. **On PR to main**:

   - All of the above
   - Integration tests
   - Build verification
   - Deploy to preview/staging environment (for features)

3. **On merge to main**:

   - Run all tests
   - Build production artifacts
   - Deploy to production (after release tag)
   - Create GitHub release (for releases)
   - Update changelog

4. **On release tag creation**:
   - Build and sign release artifacts
   - Create GitHub/GitLab release
   - Deploy to production
   - Notify team

## Common Scenarios

### Scenario 1: Working on Multiple Features

```bash
# Start feature A
git checkout -b feature/123-feature-a main

# Need to work on feature B
git stash
git checkout -b feature/456-feature-b main

# Return to feature A
git checkout feature/123-feature-a
git stash pop
```

### Scenario 2: Urgent Production Fix

```bash
# Create hotfix from main
git checkout -b hotfix/1.0.1 main

# Fix and test
git commit -m "fix(api): resolve memory leak"

# Update version
git commit -m "chore(release): bump version to 1.0.1"

# Push and create PR
git push origin hotfix/1.0.1

# After merge, tag the release
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Critical hotfix"
git push origin main --tags
```

### Scenario 3: Feature Needs Changes from Main

```bash
# Update feature branch with latest from main
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main

# Resolve any conflicts
git add .
git rebase --continue

# Force push (use with caution)
git push origin feature/your-feature --force-with-lease
```

### Scenario 4: Preparing a Release

```bash
# Create release branch
git checkout -b release/2.0.0 main

# Update version in package.json, setup.py, etc.
npm version 2.0.0  # or appropriate command

# Update CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs(changelog): update for version 2.0.0"

# Push and create PR
git push origin release/2.0.0

# After merge and approval, tag the release
git checkout main
git pull origin main
git tag -a v2.0.0 -m "Release version 2.0.0"
git push origin main --tags
```

## Tools and Automation

### Recommended Tools

- **Git GUI Clients**:

  - GitKraken
  - SourceTree
  - GitHub Desktop
  - Fork

- **Branch Management**:

  - `git-flow` extension (adapted)
  - `git-town` for branch synchronization

- **Automation**:
  - GitHub Actions / GitLab CI / Bitbucket Pipelines
  - Branch cleanup scripts
  - Automated version bumping
  - Automated changelog generation

### Git Aliases

Add to `.gitconfig`:

```ini
[alias]
    # Quick branch switching
    co = checkout
    cob = checkout -b
    com = checkout main

    # View branches
    br = branch
    branches = branch -a

    # Quick status
    st = status -sb

    # Pull with rebase
    up = pull --rebase --autostash
    upm = !git checkout main && git pull --rebase --autostash

    # Pretty log
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

    # Delete merged branches
    cleanup = "!git branch --merged | grep -v '\\*\\|main' | xargs -n 1 git branch -d"

    # Create feature branch
    feat = "!f() { git checkout main && git pull && git checkout -b feature/$1; }; f"

    # Create bugfix branch
    bug = "!f() { git checkout main && git pull && git checkout -b bugfix/$1; }; f"

    # Create hotfix branch
    hot = "!f() { git checkout main && git pull && git checkout -b hotfix/$1; }; f"
```

## Troubleshooting

### Common Issues

**Issue**: Accidentally committed to wrong branch

```bash
# Move commit to new branch
git branch feature/correct-branch
git reset HEAD~ --hard
git checkout feature/correct-branch
```

**Issue**: Need to undo last commit

```bash
# Keep changes
git reset HEAD~

# Discard changes
git reset HEAD~ --hard
```

**Issue**: Branch diverged from remote

```bash
# Fetch and reset
git fetch origin
git reset --hard origin/your-branch
```

**Issue**: Accidentally committed to main

```bash
# Create new branch with the commit
git branch feature/my-changes

# Reset main to remote
git reset --hard origin/main

# Switch to new branch
git checkout feature/my-changes
```

**Issue**: Need to sync feature with latest main

```bash
# Option 1: Rebase (cleaner history)
git checkout feature/your-branch
git fetch origin
git rebase origin/main

# Option 2: Merge (preserves history)
git checkout feature/your-branch
git fetch origin
git merge origin/main
```

## Quick Reference

### Branch Types Summary

| Branch Type | From | To   | Purpose                   | Example                   |
| ----------- | ---- | ---- | ------------------------- | ------------------------- |
| feature     | main | main | New features              | feature/123-login-page    |
| bugfix      | main | main | Bug fixes                 | bugfix/456-validation-fix |
| release     | main | main | Release preparation       | release/1.0.0             |
| hotfix      | main | main | Critical production fixes | hotfix/1.0.1              |

### Common Commands

```bash
# Start new feature
git checkout main && git pull && git checkout -b feature/123-new-feature

# Update feature with main
git checkout main && git pull && git checkout feature/123-new-feature && git rebase main

# Finish feature
git checkout main && git pull && git merge feature/123-new-feature
git branch -d feature/123-new-feature
git push origin --delete feature/123-new-feature

# Create release
git checkout main && git pull && git checkout -b release/1.0.0

# Tag release
git tag -a v1.0.0 -m "Release 1.0.0" && git push origin --tags
```

## References

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [GitLab Flow](https://docs.gitlab.com/ee/topics/gitlab_flow.html)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
