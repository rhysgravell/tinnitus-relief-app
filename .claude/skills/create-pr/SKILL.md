---
name: create-pr
description: Workflow for starting new work and raising a pull request in this repo. Use whenever beginning a new feature/fix, or when asked to open/raise a PR.
---

# Creating a PR

Follow these steps in order. Do not skip ahead to raising a PR until the earlier steps are satisfied.

## 1. Start from an up-to-date main

Before starting any new work:

```bash
git checkout main
git pull
```

## 2. Create a feature branch

Never commit directly to `main`. Create a branch named for the work, using the appropriate prefix:

- `feat/<short-description>` for new features
- `fix/<short-description>` for bug fixes
- `chore/<short-description>` for tooling/config/non-user-facing changes

```bash
git checkout -b feat/short-description
```

## 3. Do the work

Implement the change on the feature branch, committing as you go.

## 4. Add appropriate tests

Before raising a PR, make sure the change is tested:

- New features and bug fixes need test coverage for the new behavior (unit tests under the existing Jest setup; add to an existing test file or create one alongside the code it covers).
- Bug fixes should include a test that fails without the fix and passes with it, where practical.
- Pure asset/config/doc-only changes (no logic) don't need new tests, but should still pass existing checks.

Run the full check before moving on:

```bash
npx tsc --noEmit
npx jest
```

Both must pass cleanly (no type errors, all tests green) before proceeding.

## 5. Raise the PR

Once main is current, the branch is based on it, and tests pass:

```bash
git push -u origin HEAD
gh pr create --title "..." --body "..."
```

Write the PR title/body per the standard format (Summary + Test plan). Do not merge without explicit user approval.
