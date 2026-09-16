# netlify-purge-cloudflare-on-deploy (repo-managed)

`netlify-purge-cloudflare-on-deploy` is installed on this site through the
Netlify UI. The published version of that plugin calls `failBuild()` from its
`onPostBuild` step whenever it cannot find Cloudflare credentials in the build
environment, which made every deploy fail with:

```
Error: Could not determine auth method. Please review the plugin README file
and verify your environment variables
```

This site has no `CLOUDFLARE_*` environment variables, so that failure happened
on every build and blocked deploys even though the site itself built fine.

Netlify resolves build plugins from the repository's own `node_modules` before
falling back to the copy it auto-installs for UI-installed plugins, so declaring
this directory as the `netlify-purge-cloudflare-on-deploy` dependency in the
root `package.json` makes the build use this implementation instead.

It keeps the plugin's behaviour:

- With `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` (or `CLOUDFLARE_API_KEY`
  plus `CLOUDFLARE_EMAIL`) set, the Cloudflare cache is purged after a
  successful deploy, exactly as before.
- Without them, the build logs a message explaining how to enable the purge and
  continues, so a missing optional integration no longer blocks deploys.

If the Cloudflare purge is no longer wanted at all, uninstall the plugin in
**Site configuration → Build & deploy → Build plugins** in the Netlify UI and
delete this directory along with its entry in `package.json`.
