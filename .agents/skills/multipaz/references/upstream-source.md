# Current API and Source Discovery

This skill deliberately has no source pin. Multipaz KDoc is built from the
current repository and is the public-API source of truth:

- [Multipaz KDoc](https://developer.multipaz.org/kdocs/index.html)
- [Multipaz source repository](https://github.com/openwallet-foundation/multipaz)

## Before generating code

1. Look up every public API in KDoc by its fully qualified symbol. Do not copy
   signatures, constructor arguments, or package names from this skill.
2. Inspect the target checkout's current `settings.gradle.kts`, Gradle files,
   source sets, samples, and tests for module selection and platform wiring.
3. Use `rg` to find the current implementation or sample by feature and symbol;
   do not assume a class name or path remains stable.
4. If KDoc, current source, and the target dependency version do not provide
   enough evidence, report that limitation instead of guessing.

## Maintenance policy

Keep this skill limited to stable workflows and guardrails. Do not add public
API signatures or copyable SDK code. A new Multipaz release does not require a
skill update unless these stable workflows or platform-support boundaries change.
