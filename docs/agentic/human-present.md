---
title: Human Present
description: An agentic shopping flow where a human approves credential presentation and payment, built on one MCP server.
sidebar_position: 2
pagination_label: Human Present
hide_table_of_contents: false
---

# Human Present

In a **Human Present** flow, the AI agent does the work conversationally —
browsing, building a cart, answering questions — but the **sensitive steps stay
with the user**: presenting a digital credential from their wallet (age, loyalty)
and authorizing payment with a passkey or their phone's wallet. The human is in
the loop exactly where it matters.

We already have a working reference implementation of this flow: the
**Product Picker MCP app**, an agentic shopping demo built as **one MCP server
that runs on every surface** — the Claude native app, Claude on the web, Claude
Desktop, ChatGPT, Goose, and Claude Code in the terminal.

**Repository:** [openmobilehub/mcp-apps-shopping-demo](https://github.com/openmobilehub/mcp-apps-shopping-demo)

## Sample

A full end-to-end run — the agent builds the cart, loyalty + age credentials are
presented cross-device from a phone (selective disclosure), and a single passkey
biometric authorizes an x402 on-chain settlement:

<iframe
  width="100%"
  height="480"
  src="https://www.youtube.com/embed/biTqHo2dL7M"
  title="Product Picker — agentic checkout with cross-device credentials"
  style={{ border: "none", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>

> If the embedded video does not load, watch it directly:
> [youtube.com/watch?v=biTqHo2dL7M](https://www.youtube.com/watch?v=biTqHo2dL7M)

## Run it locally

The app is a single MCP server. To try your own copy as a **custom connector**,
build it, run it over HTTP, and expose it over HTTPS with a tunnel.

### 1. Build and start the server

```bash
npm install
npm run build
PORT=3001 node dist/main.js
```

### 2. Create a tunnel URL for the custom connector

MCP hosts require an `https://` URL, so tunnel the local port (for example with
[ngrok](https://ngrok.com)) to get a public origin you can register as a
connector:

```bash
ngrok http 3001
```

Then restart the server pointed at the tunnel origin, so the checkout link
resolves from the user's browser instead of `localhost`:

```bash
PORT=3001 \
PUBLIC_BASE_URL="https://YOUR-TUNNEL.ngrok.app" \
ALLOWED_HOSTS="YOUR-TUNNEL.ngrok.app" \
node dist/main.js
```

Your connector URL is the tunnel origin plus `/mcp`:
`https://YOUR-TUNNEL.ngrok.app/mcp`.

### 3. Install it in Claude Code as a custom connector

Add the tunnel's `/mcp` URL as a streamable-HTTP server:

```bash
claude mcp add --transport http product-picker https://YOUR-TUNNEL.ngrok.app/mcp
```

Then ask *"Show me the product picker"* and shop without leaving the terminal.

### 4. Install it in ChatGPT as a custom connector

ChatGPT can add the same server as a custom connector:

1. Enable **developer mode** in ChatGPT (Settings → **Connectors** → **Advanced**
   → toggle **Developer mode**).
2. Go to **Settings → Connectors → Create** (or **Add custom connector**).
3. Paste the tunnel's `/mcp` URL as the MCP server URL:
   `https://YOUR-TUNNEL.ngrok.app/mcp`, give it a name, and save.
4. Start a chat, enable the connector, and ask *"Show me the product picker"* —
   the grid renders inline, and checkout hands off to the mock merchant page.
