<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Public site is static public/beranda.html that reads apps/downloads/profile via the REST API with the publishable key and posts contact messages; admin CRUD lives in src/routes/admin.tsx (first signed-up user becomes admin via DB trigger). Why: keeps the user's original HTML design intact.
