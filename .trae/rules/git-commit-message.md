---
alwaysApply: false
scene: git_message
---

Write your rules here to customize the style of AI-generated commit messages.
refactor(profile): migrate legacy lifecycle to useEffect

- Removes prohibited 'componentWillReceiveProps' lifecycle method
- Implements synchronized state using hooks to support React 19 concurrent features
- test(rtl): updates wrapper to use act() for async profile resolution

