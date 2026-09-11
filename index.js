const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json({ limit: '1mb' }));

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const STATUS_COLORS = {
  none: 0x2ecc71,
  minor: 0xf1c40f,
  major: 0xe67e22,
  critical: 0xe74c3c
};

const STATUS_LABELS = {
  operational: 'Operational',
  degraded_performance: 'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
  under_maintenance: 'Under Maintenance'
};

const INCIDENT_STATUS_LABELS = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  verifying: 'Verifying'
};

function formatStatus(value) {
  if (!value) return 'Unknown';

  return (
    STATUS_LABELS[value] ||
    INCIDENT_STATUS_LABELS[value] ||
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  );
}

function getColor(indicator) {
  return STATUS_COLORS[indicator] ?? 0x95a5a6;
}

function truncate(value, length) {
  if (!value) return '';

  return value.length > length
    ? `${value.slice(0, length - 3)}...`
    : value;
}

function buildComponentEmbed(payload) {
  const { page, component, component_update } = payload;

  return {
    title: `Component Status Changed: ${component?.name || 'Unknown Component'}`,
    color: getColor(page?.status_indicator),
    fields: [
      {
        name: 'Previous Status',
        value: formatStatus(component_update?.old_status),
        inline: true
      },
      {
        name: 'Current Status',
        value: formatStatus(component_update?.new_status),
        inline: true
      },
      {
        name: 'Page Status',
        value: page?.status_description || 'Unknown',
        inline: false
      }
    ],
    timestamp: component_update?.created_at || new Date().toISOString(),
    footer: {
      text: `Component ID: ${component?.id || component_update?.component_id || 'Unknown'}`
    }
  };
}

function buildIncidentEmbed(payload) {
  const { page, incident } = payload;

  const updates = Array.isArray(incident?.incident_updates)
    ? incident.incident_updates
    : [];

  const latestUpdate = updates[0];

  const embed = {
    title: `Incident: ${incident?.name || 'Unnamed Incident'}`,
    color: getColor(page?.status_indicator),
    fields: [
      {
        name: 'Status',
        value: formatStatus(incident?.status),
        inline: true
      },
      {
        name: 'Impact',
        value: formatStatus(incident?.impact),
        inline: true
      },
      {
        name: 'Page Status',
        value: page?.status_description || 'Unknown',
        inline: false
      }
    ],
    timestamp:
      incident?.updated_at ||
      incident?.created_at ||
      new Date().toISOString(),
    footer: {
      text: `Incident ID: ${incident?.id || 'Unknown'}`
    }
  };

  if (latestUpdate?.body) {
    embed.description = truncate(latestUpdate.body, 4096);
  }

  if (incident?.shortlink) {
    embed.url = incident.shortlink;
  }

  return embed;
}

function buildEmbed(payload) {
  if (payload?.component_update) {
    return buildComponentEmbed(payload);
  }

  if (payload?.incident) {
    return buildIncidentEmbed(payload);
  }

  return null;
}

async function handleWebhook(req, res) {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL is not configured');

    return res.status(500).json({
      ok: false,
      error: 'Discord webhook is not configured'
    });
  }

  try {
    const embed = buildEmbed(req.body);

    if (!embed) {
      return res.status(200).json({
        ok: true,
        ignored: true
      });
    }

    await axios.post(
      DISCORD_WEBHOOK_URL,
      {
        username: 'Statuspage',
        embeds: [embed]
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({
      ok: true
    });
  } catch (error) {
    console.error(
      'Discord delivery failed:',
      error.response?.data || error.message
    );

    return res.status(502).json({
      ok: false,
      error: 'Failed to deliver webhook'
    });
  }
}

app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'statuspage-discord-webhook'
  });
});

app.post('/', handleWebhook);

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true
  });
});

module.exports = app;
