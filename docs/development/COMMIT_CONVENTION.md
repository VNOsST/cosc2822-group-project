# Commit Convention

This document outlines the commit message conventions to be followed in this project. Adhering to these guidelines will help maintain a clear and consistent project history, making it easier for all contributors to understand changes over time.

## Structure

Each commit message should follow the structure below:

```
<prefix>(<scope>): <description>

[optional body]

[optional footer]
```

### Example

```
feat(auth): add OAuth2 authentication

Implement OAuth2 flow with Google and GitHub providers.
Includes token refresh mechanism and session management.

Closes #123
```

## Prefixes

| Prefix   | Purpose                                 | Example                                   |
| -------- | --------------------------------------- | ----------------------------------------- |
| feat     | Introduce a new feature to the codebase | `feat(api): add user search endpoint`     |
| fix      | Fix a bug in the codebase               | `fix(login): resolve session timeout`     |
| docs     | Add or update documentation             | `docs(readme): update installation steps` |
| style    | Update code formatting and style        | `style(css): format with prettier`        |
| refactor | Refactor code without changing behavior | `refactor(utils): simplify date parsing`  |
| perf     | Improve performance                     | `perf(db): optimize query performance`    |
| test     | Add or update code related to testing   | `test(auth): add integration tests`       |
| chore    | Update build tasks and configurations   | `chore(deps): update dependencies`        |
| ci       | Update CI/CD configuration              | `ci(github): add automated deployment`    |
| build    | Changes that affect the build system    | `build(webpack): update config`           |
| revert   | Revert a previous commit                | `revert: feat(api): add user endpoint`    |

## Best Practices

### Description Guidelines

- **Use imperative mood**: "add feature" not "added feature" or "adds feature"
- **Keep it concise**: Limit to 50-72 characters
- **Start with lowercase**: Unless it's a proper noun
- **No period at the end**: Keep it clean
- **Be specific**: "fix login bug" → "fix session timeout in login flow"

### Scope (Optional)

The scope provides additional context about what part of the codebase is affected:

- Use parentheses: `feat(auth):`
- Keep it short: single word or hyphenated phrase
- Be consistent: use the same scopes across the project
- Examples: `(api)`, `(ui)`, `(auth)`, `(database)`, `(user-profile)`

### Body (Optional)

- **Separate from description**: Use a blank line
- **Explain what and why**: Not how (code shows how)
- **Wrap at 72 characters**: For better readability
- **Use bullet points**: For multiple changes
- **Provide context**: Include motivation for the change

### Footer (Optional)

Use for:

- **Breaking changes**: `BREAKING CHANGE: description`
- **Issue references**: `Closes #123`, `Fixes #456`, `Relates to #789`
- **Co-authors**: `Co-authored-by: Name <email>`
- **Reviewed-by**: `Reviewed-by: Name <email>`

## Examples

### Simple Feature

```
feat(navbar): add dark mode toggle
```

### Bug Fix with Details

```
fix(cart): prevent duplicate item additions

Users were able to add the same item multiple times by rapidly
clicking the add button. Added debouncing and disabled state
during the API call.

Fixes #234
```

### Breaking Change

```
feat(api): change authentication endpoint

BREAKING CHANGE: The /auth endpoint now requires API version
in the URL path (/v2/auth instead of /auth). Update all clients
to use the new endpoint structure.

Migration guide available in docs/migration-v2.md
```

### Refactoring

```
refactor(utils): extract validation logic

Move validation functions from component files to shared utils.
No functional changes, improves code reusability and testability.
```

## Common Mistakes to Avoid

❌ **Don't**

- `fixed stuff`
- `Updated files`
- `WIP`
- `asdfgh`
- `Fixed bug in the login system that was causing issues`

✅ **Do**

- `fix(auth): resolve session timeout issue`
- `docs(api): update endpoint documentation`
- `feat(search): implement fuzzy matching`
- `refactor(components): extract header logic`
- `fix(login): prevent race condition in token refresh`

## Atomic Commits

- **One logical change per commit**: Don't mix unrelated changes
- **Commit often**: Small, focused commits are easier to review and revert
- **Test before committing**: Ensure each commit passes tests
- **Complete work**: Each commit should leave the code in a working state

## Tools and Automation

Consider using:

- **Commitlint**: Enforce commit message format
- **Husky**: Git hooks for pre-commit checks
- **Commitizen**: Interactive commit message builder
- **Conventional Changelog**: Automatically generate changelogs

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
