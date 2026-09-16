// Repo-managed replacement for the `netlify-purge-cloudflare-on-deploy` plugin
// that is installed on this site through the Netlify UI. See README.md for why
// it exists. Behaviour is identical to the published plugin, except that a
// missing Cloudflare configuration is reported as a warning instead of failing
// the whole build.

const {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_EMAIL,
} = process.env;

const getAuthMethod = () => {
  if (CLOUDFLARE_ZONE_ID === undefined) {
    return undefined;
  }
  if (CLOUDFLARE_API_TOKEN !== undefined) {
    return 'TOKEN';
  }
  if (CLOUDFLARE_API_KEY !== undefined && CLOUDFLARE_EMAIL !== undefined) {
    return 'KEY';
  }
  return undefined;
};

const getHeaders = (authMethod) =>
  authMethod === 'TOKEN'
    ? {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    : {
        'X-Auth-Email': CLOUDFLARE_EMAIL,
        'X-Auth-Key': CLOUDFLARE_API_KEY,
        'Content-Type': 'application/json',
      };

const SKIP_MESSAGE = `Skipping Cloudflare cache purge: no Cloudflare credentials are configured for this build.
To enable it, set CLOUDFLARE_ZONE_ID plus either CLOUDFLARE_API_TOKEN, or CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL,
in the Netlify site environment variables. Deploys are not blocked while these are missing.`;

module.exports = {
  onPostBuild() {
    const authMethod = getAuthMethod();
    if (authMethod === undefined) {
      console.log(SKIP_MESSAGE);
      return;
    }
    console.log(`Cloudflare ${authMethod} authentication method detected.`);
  },

  async onSuccess({ utils: { build: { failPlugin } } }) {
    const authMethod = getAuthMethod();
    if (authMethod === undefined) {
      return;
    }

    console.log('Preparing to trigger Cloudflare cache purge');
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: getHeaders(authMethod),
          body: JSON.stringify({ purge_everything: true }),
        },
      );

      if (!response.ok) {
        return failPlugin(
          `Cloudflare cache couldn't be purged. Status: ${response.status} ${response.statusText}`,
        );
      }
      console.log('Cloudflare cache purged successfully!');
    } catch (error) {
      return failPlugin('Cloudflare cache purge failed', { error });
    }
  },
};
