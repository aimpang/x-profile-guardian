"""
Quick inspection of XGuard pages
"""
from playwright.sync_api import sync_playwright
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("\n=== LANDING PAGE ===")
    page.goto(BASE_URL, wait_until="networkidle")
    page.screenshot(path="/tmp/landing.png", full_page=True)
    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")

    # Check buttons
    buttons = page.locator("button").all()
    print(f"Found {len(buttons)} buttons:")
    for i, btn in enumerate(buttons[:10]):
        text = btn.text_content()
        print(f"  {i+1}. {text}")

    # Check links
    links = page.locator("a").all()
    print(f"\nFound {len(links)} links:")
    for i, link in enumerate(links[:10]):
        text = link.text_content()
        href = link.get_attribute("href")
        print(f"  {i+1}. {text} -> {href}")

    print("\n=== LOGIN PAGE ===")
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.screenshot(path="/tmp/login.png", full_page=True)
    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")

    # Check for input fields
    inputs = page.locator("input").all()
    print(f"Found {len(inputs)} input fields:")
    for i, inp in enumerate(inputs[:10]):
        type_attr = inp.get_attribute("type")
        placeholder = inp.get_attribute("placeholder")
        print(f"  {i+1}. type={type_attr}, placeholder={placeholder}")

    # Check visible text
    print("\nPage content (first 500 chars):")
    content = page.text_content()
    print(content[:500])

    browser.close()

print("\nScreenshots saved to /tmp/")
print("- landing.png")
print("- login.png")
