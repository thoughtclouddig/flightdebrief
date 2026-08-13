#!/bin/bash
set -e

# Runs automatically after a task merge: install deps and ensure the dev
# database schema (idempotent). Non-interactive; keep fast.
npm install --no-audit --no-fund
npm run db:init
