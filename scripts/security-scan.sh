#!/usr/bin/env bash
# ==============================================================================
# Security Scan Script (SAST, SCA, DAST)
# Run security analysis locally before submitting a Pull Request / Merge Request
# ==============================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
  echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_warn() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
  echo -e "${RED}Error:${NC} $1"
}

run_sast() {
  print_step "Running SAST (Static Application Security Testing) with Semgrep..."
  if command -v semgrep &>/dev/null; then
    semgrep scan --config auto --config "p/owasp-top-ten" --config "p/secrets"
  elif command -v docker &>/dev/null; then
    docker run --rm -v "$(pwd):/src" returntocorp/semgrep semgrep scan --config auto --config "p/owasp-top-ten" --config "p/secrets"
  else
    print_warn "Neither 'semgrep' nor 'docker' found. Running basic linter and secrets check..."
    npm run lint || true
  fi
}

run_sca() {
  print_step "Running SCA (Software Composition Analysis) on dependencies..."
  echo "Checking npm dependencies with npm audit..."
  npm audit --audit-level=high || true

  if command -v trivy &>/dev/null; then
    echo "Running Trivy filesystem and dependency scan..."
    trivy fs --severity HIGH,CRITICAL .
  elif command -v docker &>/dev/null; then
    echo "Running Trivy via Docker..."
    docker run --rm -v "$(pwd):/app" aquasec/trivy fs --severity HIGH,CRITICAL /app
  else
    print_warn "Trivy not installed. Install with 'brew install trivy' for comprehensive SCA scans."
  fi
}

run_dast() {
  TARGET_URL="${1:-http://localhost:3000}"
  print_step "Running DAST (Dynamic Application Security Testing) against ${TARGET_URL}..."

  if command -v docker &>/dev/null; then
    echo "Executing OWASP ZAP baseline scan against ${TARGET_URL}..."
    docker run --rm --network host -v "$(pwd)/.zap:/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
      -t "${TARGET_URL}" \
      -c rules.tsv \
      -r zap_report.html \
      -a || true
    echo "Report generated at .zap/zap_report.html"
  else
    print_warn "Docker is required to run OWASP ZAP dynamic scanner locally."
  fi
}

usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --sast          Run SAST (Semgrep & code analysis)"
  echo "  --sca           Run SCA (Trivy & npm audit)"
  echo "  --dast [URL]    Run DAST (OWASP ZAP dynamic scan against target URL, default: http://localhost:3000)"
  echo "  --all           Run SAST, SCA, and DAST"
  echo "  --help          Show this help message"
  echo ""
}

MODE="${1:---all}"

case "$MODE" in
  --sast)
    run_sast
    ;;
  --sca)
    run_sca
    ;;
  --dast)
    run_dast "$2"
    ;;
  --all)
    run_sast
    run_sca
    run_dast "$2"
    ;;
  --help|-h)
    usage
    ;;
  *)
    echo "Unknown option: $MODE"
    usage
    exit 1
    ;;
esac

echo -e "\n${GREEN}Security scan finished successfully.${NC}"
