from playwright.sync_api import sync_playwright
import sys

BASE = "http://localhost:8081"
results = []

def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append(f"[{status}] {name}" + (f": {detail}" if detail else ""))
    print(results[-1])

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    # --- Home page ---
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    check("Home loads", page.title() != "")
    check("Home has XSentinel branding", "XSentinel" in page.content())
    check("Home has Start free trial button", page.locator("text=Start free trial").count() > 0)
    check("Home has pricing $9", "$9" in page.content())
    check("Home has yearly $89", "$89" in page.content())
    check("Home has Sign in link", page.locator("text=Sign in").count() > 0)

    # --- Login page ---
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    check("Login page loads", "Welcome back" in page.content() or "Sign in" in page.content())
    check("Login has email input", page.locator("input[type='email']").count() > 0)
    check("Login has password input", page.locator("input[type='password']").count() > 0)
    check("Login has Google button", "Google" in page.content())
    check("Login has Create account link", page.locator("text=Create an account").count() > 0)

    # --- Signup page ---
    page.goto(f"{BASE}/signup")
    page.wait_for_load_state("networkidle")
    check("Signup page loads", "Create an account" in page.content() or "Start free trial" in page.content())
    check("Signup has email input", page.locator("input[type='email']").count() > 0)
    check("Signup has password input", page.locator("input[type='password']").count() > 0)
    check("Signup has Google button", "Google" in page.content())

    # --- Terms page ---
    page.goto(f"{BASE}/terms")
    page.wait_for_load_state("networkidle")
    check("Terms page loads", "Terms" in page.content())

    # --- Privacy page ---
    page.goto(f"{BASE}/privacy")
    page.wait_for_load_state("networkidle")
    check("Privacy page loads", "Privacy" in page.content())

    # --- Dashboard redirect (unauthenticated) ---
    page.goto(f"{BASE}/dashboard")
    page.wait_for_load_state("networkidle")
    check("Dashboard redirects unauth user", page.url != f"{BASE}/dashboard" or "login" in page.url.lower() or "sign" in page.content().lower())

    # --- Console errors ---
    check("No console errors on home", len(console_errors) == 0, f"{len(console_errors)} errors: {console_errors[:3]}" if console_errors else "")

    browser.close()

print("\n--- SUMMARY ---")
fails = [r for r in results if r.startswith("[FAIL]")]
print(f"{len(results) - len(fails)}/{len(results)} passed")
if fails:
    print("FAILURES:")
    for f in fails:
        print(" ", f)
sys.exit(len(fails))
