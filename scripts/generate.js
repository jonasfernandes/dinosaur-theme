const { readFile } = require("fs").promises;
const { join } = require("path");
const { Type, DEFAULT_SCHEMA, load } = require("js-yaml");
const tinycolor = require("tinycolor2");

const withAlphaType = new Type("!alpha", {
  kind: "sequence",
  construct: ([hexRGB, alpha]) => hexRGB + alpha,
  represent: ([hexRGB, alpha]) => hexRGB + alpha,
});

const schema = DEFAULT_SCHEMA.extend([withAlphaType]);

const transformSoft = (theme) => {
  const soft = JSON.parse(JSON.stringify(theme));
  const brightColors = [...soft.dinosaur.ansi, ...soft.dinosaur.brightOther];
  const baseColors = [...soft.dinosaur.base];
  const otherColors = [...soft.dinosaur.other];

  for (const key of Object.keys(soft.colors)) {
    const color = soft.colors[key];
    if (
      brightColors.includes(color) ||
      baseColors.includes(color) ||
      otherColors.includes(color)
    ) {
      soft.colors[key] = tinycolor(color).desaturate(20).toHexString();
    }
  }
  soft.tokenColors = soft.tokenColors.map((value) => {
    const foregroundColor = value.settings.foreground;
    if (
      brightColors.includes(foregroundColor) ||
      baseColors.includes(foregroundColor)
    ) {
      value.settings.foreground = tinycolor(foregroundColor)
        .desaturate(20)
        .toHexString();
    }
    return value;
  });
  return soft;
};

module.exports = async () => {
  const yamlFile = await readFile(
    join(__dirname, "..", "base", "dinosaur.yml"),
    "utf-8",
  );

  const base = load(yamlFile, { schema });

  for (const key of Object.keys(base.colors)) {
    if (!base.colors[key]) {
      delete base.colors[key];
    }
  }

  return {
    base,
    soft: transformSoft(base),
  };
};
