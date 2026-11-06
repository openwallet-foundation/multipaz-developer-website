# Installing and distributing this skill

The Multipaz skill lives in the
[`openwallet-foundation/multipaz-developer-website`](https://github.com/openwallet-foundation/multipaz-developer-website)
repository at `.agents/skills/multipaz/`. Distribute that directory with its
`SKILL.md`, `references/`, `assets/`, `evals/`, and `docs/` contents together.

The installation instructions below use `vercel-labs/skills`, which supports
Codex, Claude Code, OpenCode, and other compatible agents.

## Skill identity

- For `vercel-labs/skills`, the skill name is `multipaz`, declared by the `name`
  field in the YAML frontmatter of `SKILL.md`; `description` is also required.
- Description and license: frontmatter in `SKILL.md`.
- Version and compatibility policy: `metadata.version` and `compatibility` in
  `SKILL.md`, explained in `references/upstream-source.md`.

## Install with vercel-labs/skills

Requires Node.js and npm (`npx`). Run these commands from the project where you
want to install the skill.

```bash
# Discover skills available in the Multipaz repository.
npx skills add openwallet-foundation/multipaz-developer-website --list

# Install multipaz and interactively select the target agents.
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz

# Or install directly for Codex in the current project.
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz --agent codex
```

The repository shorthand follows the repository's default branch. To install
from a specific branch or revision, use its GitHub tree URL. For example:

```bash
npx skills add https://github.com/openwallet-foundation/multipaz-developer-website/tree/main --skill multipaz --agent codex
```

The CLI discovers `.agents/skills/multipaz/SKILL.md` and installs the skill with
its supporting resources. Keep that entry file named `SKILL.md`; do not rename
it to `multipaz.md` for this workflow. No npm package, HTTP catalog, or plugin
manifest is needed in the source repository.

Installation is project-scoped by default; add `--global` for user-wide
installation. Use `--agent` to select another supported agent, or omit it for
interactive selection. For Codex and OpenCode, project installation uses
`.agents/skills/multipaz/`.

```bash
npx skills list
npx skills update multipaz
npx skills remove multipaz
```

See the [vercel-labs/skills documentation](https://github.com/vercel-labs/skills)
for supported agents and command options.

## License and attribution

Apache-2.0, the same as the repository this was developed in. The content was
written for the Open Wallet Foundation Multipaz repository. It points agents to
current KDoc and source discovery rather than copying upstream source files.

## Eval fixtures

`evals/README.md` names the public projects to run the scenarios against:
Multipaz and `openwallet-foundation/multipaz-samples`.