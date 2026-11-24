# Christmas Scene for Claude

A Claude Code mod that puts a snowy Christmas night behind your conversation in the Claude desktop and mobile apps. It shows rows of snow-covered evergreens under a glowing moon and twinkling stars, decorated trees with softly pulsing lights, and three layers of gently falling snow. A small badge in the top-left corner shows the current outside temperature for your city. The mod also sets a matching dark winter color theme.

## Install

At the prompt of a terminal Claude Code session:

```
/plugin install christmas-scene --marketplace SweetHeartache/claude-christmas-scene
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install christmas-scene --marketplace SweetHeartache/claude-christmas-scene
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `SweetHeartache/claude-christmas-scene`, then **Add plugin**.

## Set your city

```
/snow-city Seattle
```

You can also give coordinates: `/snow-city 47.61,-122.33`. The city is remembered across sessions, and the temperature refreshes every 15 minutes.

The temperature comes from [Open-Meteo](https://open-meteo.com), a free weather service that needs no account or key. Only the city name and its coordinates are sent to it.

## Notes

- The scene appears in the desktop and mobile apps only. Terminals and editors don't draw backdrops.
- On desktop, the open sidebar covers the top-left badge. Collapse the sidebar to see the temperature.
- If your system asks for reduced motion, the snow and lights hold still.

## License

MIT
