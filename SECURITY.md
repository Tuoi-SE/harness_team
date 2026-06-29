# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.13.x  | Yes       |
| < 0.13  | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in Harness, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

Instead, contact **Quang Tuoi** via **https://github.com/Tuoi-SE/Harness-Team** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Security Model

Harness is a desktop application that reads and writes Claude Code configuration files locally. It does not:

- Transmit data to external servers
- Collect telemetry or analytics
- Store credentials (API keys are managed by Claude Code itself)
- Execute arbitrary remote code

### File Access

Harness reads and writes files in:

- `~/.claude/` — Claude Code global configuration
- `.claude/` — Project-specific configuration
- Project directories — for git operations

### Network Access

Harness only makes network requests for:

- **Auto-updates** — checks GitHub releases for new versions
- **Plugin marketplace** — fetches the plugin registry

### Code Signing

- macOS builds are signed and notarized with an Apple Developer certificate
- Auto-update artifacts are signed with Tauri's updater key

## Best Practices

- Always download Harness from the [official GitHub releases](https://github.com/Tuoi-SE/Harness-Team/releases)
- Verify the app signature on macOS (Gatekeeper does this automatically)
- Keep Harness updated to receive security fixes
