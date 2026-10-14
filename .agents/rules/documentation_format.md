# Documentation Format Guidelines

## Specification & Contract Standards

1. **Always Author in Markdown**:
   - Architectural specifications, API contracts, route registries, and interface documentation must be maintained in Markdown (`.md`) format directly inside the repository.
   - Do not generate or substitute compiled binary formats (such as `.pdf` or `.docx`) as the primary documentation artifact unless explicitly instructed by the user.

2. **Benefits & Rationale**:
   - Ensures seamless git diffing and version control tracking across branches and PRs.
   - Enables native reading, searchability, and direct hyperlinking within GitHub, IDEs, and agent tools without external PDF viewers.
   - Simplifies programmatic verification against TypeScript types, Zod schemas, and backend endpoint implementations.
