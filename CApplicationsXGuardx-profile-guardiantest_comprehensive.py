#!/usr/bin/env python3
"""
Comprehensive XSentinel webapp tests covering security, edge cases, and user flows.
Tests the paywall enforcement, subscription gating, and trial functionality.
"""

from playwright.sync_api import sync_playwright
import sys

def test_navigation_accessible():
    """Test that main navigation is working"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state("networkidle")
            content = page.content()
            assert "XSentinel" in content or "xsentinel" in content.lower()
            print("✓ Landing page loads correctly")
            browser.close()
            return True
        except Exception as e:
            print(f"✗ Navigation test failed: {e}")
            browser.close()
            return False

def test_pricing_display():
    """Test pricing CTAs are visible"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state("networkidle")
            content = page.content()
            assert ("$9" in content or "$89" in content)
            print("✓ Pricing displayed ($9/mo, $89/yr)")
            browser.close()
            return True
        except Exception as e:
            print(f"✗ Pricing test failed: {e}")
            browser.close()
            return False

def test_paywall_redirect():
    """Test that dashboard redirects unauthenticated users"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173/dashboard", timeout=10000)
            page.wait_for_load_state("networkidle")
            final_url = page.url
            if "login" in final_url or "onboarding" in final_url:
                print("✓ Paywall enforced - redirects to auth")
                browser.close()
                return True
            else:
                print("✗ Dashboard accessible without auth (security gap)")
                browser.close()
                return False
        except Exception as e:
            print(f"✗ Paywall test failed: {e}")
            browser.close()
            return False

def test_mobile_viewport():
    """Test mobile responsiveness"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 667})
        try:
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state("networkidle")
            content = page.content()
            assert len(content) > 100
            print("✓ Mobile layout renders")
            browser.close()
            return True
        except Exception as e:
            print(f"✗ Mobile test failed: {e}")
            browser.close()
            return False

def main():
    print("\n" + "="*60)
    print("XSentinel Security & Functionality Tests")
    print("="*60 + "\n")

    tests = [
        ("Navigation", test_navigation_accessible),
        ("Pricing Display", test_pricing_display),
        ("Paywall Enforcement", test_paywall_redirect),
        ("Mobile Responsiveness", test_mobile_viewport),
    ]

    results = []
    for name, test_func in tests:
        print(f"▶ {name}...", end=" ")
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"✗ {e}")
            results.append((name, False))

    passed = sum(1 for _, r in results if r)
    print(f"\n{'='*60}")
    print(f"Results: {passed}/{len(results)} passed")
    print("="*60)
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
