# Hostinger Private Backend Template

Use this template when Hostinger allows files outside `public_html`.

```text
domains/example.com/backend/
domains/example.com/public_html/
```

Build the frontend locally and upload `frontend/dist/*` into `public_html/`. Upload `backend/*` into the private `backend/` folder. Copy `deployment/hostinger/public_html/api/index.php` into `public_html/api/index.php`.

The bridge file loads `../../backend/public/index.php`, so the API remains available at `/api/*` while backend source code stays outside the web root.
