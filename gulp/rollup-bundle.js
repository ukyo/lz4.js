const rollup = require("rollup");
const rollupConfig = require("../rollup.config");

async function rollupBundle() {
  try {
    const bundle = await rollup.rollup(rollupConfig);
    return bundle.write(rollupConfig.output);
  } catch (err) {
    console.error(err);
  }
}

module.exports = rollupBundle;
