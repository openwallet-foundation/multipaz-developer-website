# Dependency Guide

## Inspect before editing

- Check whether the project uses `gradle/libs.versions.toml`, direct strings, or convention plugins.
- Prefer the project's existing style.
- Search the target project's Gradle files, version catalogs, and build logic for `org.multipaz`, `multipaz`, and referenced dependency aliases. For example, from the project root: `rg -n "org[.]multipaz|multipaz" -g "*.gradle" -g "*.gradle.kts" -g "*.toml" -g "*.properties" -g "*.kt" -g "!**/build/**" -g "!**/.gradle/**" .`. Follow aliases and version definitions before judging whether versions are aligned.

## Select dependencies from current evidence

Use KDoc to identify the module that owns each public API, then inspect the
current Gradle declarations and the closest current sample or test. Do not copy
module names, Maven coordinates, or dependency scopes from this skill.

## Dependency rules

- Add only the modules needed for the requested workflow.
- Keep Multipaz versions aligned in consumer projects.
- Resolve the current Ktor engine and presentment dependencies from the target's
  build files and current sample before adding them.
- Do not replace project dependencies with Maven artifacts inside this repository.
- Do not upgrade unrelated Kotlin, AGP, Compose, or iOS toolchain versions unless the task explicitly includes upgrade work.

## Validation

- Re-read changed declarations and confirm their versions and source-set placement. If resolved versions are unclear, use the affected module's `dependencies` or `dependencyInsight` task with a configuration verified to exist. Validate changes with the affected module's actual compile and test tasks.
- If a feature request depends on `multipaz-compose` or `multipaz-dcapi`, verify the platform-specific dependencies and activities from the sample before adding them.
