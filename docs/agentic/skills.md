---
title: Multipaz Skill
description: Install the Multipaz AI agent skill so coding assistants understand ISO mdoc, OpenID4VCI, OpenID4VP, DCQL, and the rest of the Multipaz SDK.
sidebar_position: 0
pagination_label: Agentic Skills
hide_table_of_contents: false
---

# Multipaz Skill

The **Multipaz skill** is a portable instruction set that teaches AI coding
agents how to work with the Multipaz SDK. Instead of guessing at APIs, an agent
that loads the skill inspects your project, checks the current
[Multipaz KDoc](https://developer.multipaz.org/kdocs/index.html), and follows
Multipaz-specific rules for architecture, dependencies, and platform support.

It is a single skill named `multipaz`, distributed with the
[Multipaz developer website repository](https://github.com/openwallet-foundation/multipaz-developer-website)
at [`.agents/skills/multipaz/`](https://github.com/openwallet-foundation/multipaz-developer-website/tree/main/.agents/skills/multipaz).

## What the skill covers

| Area | What the agent can help with |
| :-- | :-- |
| **Credentials** | ISO mdoc / mDL and SD-JWT VC modeling, claims, and document stores |
| **Issuance** | OpenID4VCI offers, OAuth redirects, attestation, and provisioning UI |
| **Presentment** | QR, BLE proximity, OpenID4VP, W3C Digital Credentials API |
| **Verification** | DCQL requests, verifier workflows, trust, and certificates |
| **Platforms** | Kotlin Multiplatform, Android, iOS, SwiftUI, and Compose Multiplatform |
| **Operations** | Dependency selection, migrations, project inspection, and troubleshooting |

The skill also encodes platform boundaries — for example, that Multipaz NFC
credential **presentation** is Android-only and must not be generated for iOS.

:::info Skill, not an API reference
The skill points agents at current KDoc and your checkout's samples and tests.
It does not freeze API signatures, so agents validate against the Multipaz
version your project actually uses.
:::

## Install with `vercel-labs/skills`

The recommended installer is [`vercel-labs/skills`](https://github.com/vercel-labs/skills),
which supports Codex, Claude Code, OpenCode, and other compatible agents.
You need Node.js and npm, so `npx` is available.

Run these commands from the root of the project where you want the skill
installed.

### 1. Discover the skill

```bash
npx skills add openwallet-foundation/multipaz-developer-website --list
```

You should see `multipaz` in the list of available skills.

### 2. Install it

```bash
# Interactive: choose which agents to install for.
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz
```

To target a specific agent without the prompt, pass `--agent`:

```bash
# Install for Codex in the current project.
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz --agent codex

# Install for Claude Code.
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz --agent claude-code

# Install for OpenCode.
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz --agent opencode
```

### 3. Verify the installation

```bash
npx skills list
```

For Codex and OpenCode, a project-scoped install lands at
`.agents/skills/multipaz/` and includes the `SKILL.md` entry file plus the
skill's `references/`, `assets/`, `evals/`, and `docs/` directories.

:::tip Install globally
Project installation is the default. Add `--global` for a user-wide install:

```bash
npx skills add openwallet-foundation/multipaz-developer-website --skill multipaz --global
```
:::

## Install from a specific branch or revision

The repository shorthand follows the default branch. To pin the install to a
specific branch or revision, use the GitHub tree URL:

```bash
npx skills add https://github.com/openwallet-foundation/multipaz-developer-website/tree/main --skill multipaz --agent codex
```

## Keep the skill up to date

```bash
# Update the installed skill.
npx skills update multipaz

# Remove it.
npx skills remove multipaz
```

Re-run the update after upgrading Multipaz so the agent sees the latest
guidance.

## Use the skill

Once installed, just describe the task in your agent. The skill is selected
automatically when the request matches its description. For example:

- *"Add OpenID4VCI provisioning to this Compose Multiplatform wallet."*
- *"This verifier request fails with a DCQL mismatch — debug it."*
- *"Add Android NFC credential presentation, keeping the code in `androidMain`."*
- *"Migrate this project from an older Multipaz release to the current one."*

The agent will inspect your build files and sources first, then implement the
change against the Multipaz version in your project.

## Learn more

- **Skill source:** [openwallet-foundation/multipaz-developer-website — `.agents/skills/multipaz/`](https://github.com/openwallet-foundation/multipaz-developer-website/tree/main/.agents/skills/multipaz)
- **Installer documentation:** [vercel-labs/skills](https://github.com/vercel-labs/skills)
- **Public API reference:** [Multipaz KDoc](https://developer.multipaz.org/kdocs/index.html)
- **Reference samples:** [openwallet-foundation/multipaz-samples](https://github.com/openwallet-foundation/multipaz-samples)
