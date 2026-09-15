# Statuspage Discord Webhook

A simple **Atlassian Statuspage → Discord** webhook using Express and Discord embeds.

## How It Works

```text
Atlassian Statuspage
        |
        v
     Vercel
        |
        v
   Express Webhook
        |
        v
 Discord Webhook
```

The service receives Statuspage notifications, formats them into Discord embeds, and sends them to your Discord channel.

## Features

* Statuspage component updates
* Statuspage incidents
* Discord embeds
* Status-based embed colors
* Incident descriptions and links
* Vercel serverless deployment
* Health check endpoint

## Deploy to Vercel

### 1. Fork or Clone

Fork this repository, or clone it locally:

```bash
git clone https://github.com/tyowk/discordstatus.webhook.git
```

### 2. Import to Vercel

Go to Vercel and import the repository.

Vercel will automatically detect the project configuration from `vercel.json`.

### 3. Add Environment Variable

In your Vercel project, open:

**Settings → Environment Variables**

Add:

```text
DISCORD_WEBHOOK_URL
```

Set its value to your Discord webhook URL.

Example:

```text
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Do not expose this value publicly.

### 4. Deploy

Deploy the project.

Your webhook endpoint will be:

```text
https://your-project.vercel.app/
```

## Configure Statuspage

In Atlassian Statuspage, create a webhook notification and use your Vercel URL as the endpoint:

```text
https://your-project.vercel.app/
```

Statuspage events will then be forwarded to Discord automatically.

## Endpoints

| Method | Endpoint  | Description         |
| ------ | --------- | ------------------- |
| `GET`  | `/`       | Service information |
| `GET`  | `/health` | Health check        |
| `POST` | `/`       | Statuspage webhook  |

You can test the deployment by opening:

```text
https://your-project.vercel.app/health
```

Expected response:

```json
{
  "ok": true
}
```

## Status Colors

| Status Indicator | Color  |
| ---------------- | ------ |
| `none`           | Green  |
| `minor`          | Yellow |
| `major`          | Orange |
| `critical`       | Red    |

## Tech Stack

* Node.js
* Express
* Axios
* Vercel
* Atlassian Statuspage
* Discord Webhooks

## License

No license specified.
