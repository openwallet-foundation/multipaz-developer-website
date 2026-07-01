---
title: Get Set Up
sidebar_position: 1
---

# Get Set Up

## Clone the project

```shell
git clone https://github.com/openwallet-foundation/multipaz-utopia.git
cd multipaz-utopia
```

The repository is a Gradle multi-module project. Each organization lives under `organizations/`
(`dmv`, `bank_of_utopia`, `registry`, `upay`, `brewery`), shared issuer code is in `shared/`, and the
`deployment/` module knows how to package everything into one container image.

## Install a container runtime

You need either **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)**. Podman is recommended because it's free and requires no
license for commercial use. The build automatically detects which one you have installed.

### macOS

```shell
# Install Podman
brew install podman

# Podman runs Linux containers in a VM on macOS — initialize it once
podman machine init

# Start the VM (re-run this after each reboot)
podman machine start
```

### Linux

On Linux, Podman runs natively — no VM required:

```shell
# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y podman

# Fedora
sudo dnf install -y podman
```

:::tip
Already have Docker? You can skip Podman entirely — the Gradle build falls back to `docker` when no
`podman` binary is found.
:::

## Verify your toolchain

```shell
java -version       # should report 17 or higher
podman --version    # or: docker --version
```

With the project cloned and a container runtime ready, you're set to build the bundle in the next
step.
