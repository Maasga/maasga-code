@echo off
setlocal
REM Cloudflare credentials should be set as environment variables
REM CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN
npx wrangler pages deploy dist --project-name maasga-website
endlocal
