const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const statusColors = {
  none: 0x2ecc71,
  minor: 0xf1c40f,
  major: 0xe67e22,
  critical: 0xe74c3c,
};

function buildComponentEmbed(payload) {
  const { page, component, component_update } = payload;
  return {
    title: `Component Status Changed: ${component.name}`,
    color: statusColors[page.status_indicator] || 0x95a5a6,
    fields: [
      { name: 'Old Status', value: component_update.old_status, inline: true },
      { name: 'New Status', value: component_update.new_status, inline: true },
      { name: 'Page Status', value: page.status_description, inline: false },
    ],
    timestamp: component_update.created_at,
    footer: { text: `Page ID: ${page.id}` },
  };
}

function buildIncidentEmbed(payload) {
  const { page, incident } = payload;
  const latestUpdate = incident.incident_updates[0];
  return {
    title: `Incident: ${incident.name}`,
    url: incident.shortlink,
    description: latestUpdate ? latestUpdate.body : 'No update body provided.',
    color: statusColors[page.status_indicator] || 0x95a5a6,
    fields: [
      { name: 'Status', value: incident.status, inline: true },
      { name: 'Impact', value: incident.impact, inline: true },
      { name: 'Page Status', value: page.status_description, inline: false },
    ],
    timestamp: incident.updated_at,
    footer: { text: `Incident ID: ${incident.id}` },
  };
}

app.post('/api/webhook', async (req, res) => {
  try {
    const payload = req.body;
    let embed;

    if (payload.component_update) {
      embed = buildComponentEmbed(payload);
    } else if (payload.incident) {
      embed = buildIncidentEmbed(payload);
    } else {
      return res.status(200).send('No actionable data');
    }

    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'Statuspage',
      embeds: [embed],
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(200).send('Handled with error');
  }
});

app.all('/health', (req, res) => {
  return res.status(200).send('OK');
});

module.exports = app;
