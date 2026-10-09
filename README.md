# Password Breach Checker

A responsive web app that checks whether a password has appeared in known data breaches, **without ever sending the password**.

**Live demo:** https://simon123211.github.io/breach-checker/

## How it works
1. The password is hashed with SHA-1 in the browser (Web Crypto API).
2. Only the first 5 characters of the hash are sent to the [Pwned Passwords API](https://haveibeenpwned.com/API/v3#PwnedPasswords).
3. The API returns all breached hashes starting with those characters.
4. The browser checks for a match locally, so the API never learns which password was checked (k-anonymity).

## Features
- Bootstrap 5 layout: containers, responsive grid, cards and a collapsing navbar
- Form with Bootstrap validation, show/hide toggle and a live strength meter
- Async `fetch()` with loading state and error handling
- Accessibility: skip link, labels, `aria-live` results and an accessible progress bar
- Safe output using `textContent` to prevent HTML injection

## Built with
HTML5, Bootstrap 5, JavaScript (ES6+)

*Built as part of my MSc Computer Science with Cyber Security. Please test with example passwords only.*
