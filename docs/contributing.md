# Contributing & Conventions

Contributions are very welcome, but issues (bug reports, feature requests, suggestions) are often a good first step. The lead developer is very critical about code quality in this repository, so please read this page before creating a pull request.

## Expectations

- **Read and understand all of your code.** Whoever wants to commit or merge a change must have read every line of it and be able to explain how it works and why it is written that way.
- **Every contribution is reviewed extensively.** Expect detailed questions and requests for changes about correctness, readability, structure and fit with the rest of the code. That is how the review works, it is not a rejection.
- Small, focused changes are easier to review, and get a more careful review.

## Conventions

- **Code style**: oxfmt enforced. Run `vp check --fix` before committing.
- **Types**: Keep types in `src/shared` where they are reused across bundles.
- **Components**: Prefer small Solid components with clear props. Co-locate styles and logic.
- **State editing UX**: Validate inputs where possible; surface errors inline.
- **Commits/PRs**: Small, focused commits; describe user-visible changes in the PR body. A pull request should usually include a [changeset](./build-release.md#changesets); if you're unsure, leave it for the review.

## Code organization

Code is organized by **feature** (the domain), not by technical layer. A feature lives in
`src/devtools-panel/views/<Feature>/`; a file in `pages/` only places a view on a route.

- If a utility, type or hook is specific to certain components, keep it near those components. If it
  is more generic, move it to a more global location (`utils/`, `ui/`, `store/`).
- Components use store helpers, store helpers use plain logic, and plain logic uses neither.
- Pass data down as props, as values rather than accessors. Use context only when the data is needed
  deep in a tree.
- Comments say _why_ where it isn't obvious, not what the code does.

## Tests

Unit tests are there primarily for the benefit of AI agents. Agents work better when results can be verified quickly. Unit tests are not a product themselves; they're a regression net _for_ the product. Keep them fast and independent of each other (they run in random order). When a change breaks unit tests, fix the code or the test.

There are no coverage goals for unit tests. Tests are colocated with the file they're testing (`.test.ts` / `.test.tsx`). Shared test helpers/utilities are placed in `src/testing`.
