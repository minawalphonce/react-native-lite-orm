const fs = require("fs-extra");
const path = require("path");
const { build } = require("esbuild");
const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");

async function bundle(options) {
	return await build({
		entryPoints: [options.entryPoint],
		outfile: options.out,
		write: true,
		sourcemap: "external",
		bundle: true,
		minify: options.minify,
		plugins: [
			{
				name: "node_module_external",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) => {
						if (args.path.startsWith(".") || args.path.startsWith("/")) {
							return undefined;
						} else {
							return {
								path: args.path,
								external: true,
							};
						}
					});
				},
			},
		],
	});
}

async function extractApi() {
	const apiExtractorJsonPath = path.join(__dirname, "../api-extractor.json");
	const extractorConfig =
		ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
	const extractorResult = Extractor.invoke(extractorConfig, {
		// Equivalent to the "--local" command-line parameter
		localBuild: true,

		// Equivalent to the "--verbose" command-line parameter
		showVerboseMessages: true,
	});

	if (extractorResult.succeeded) {
		console.log(`API Extractor completed successfully`);
	} else {
		console.error(
			`API Extractor completed with ${extractorResult.errorCount} errors` +
				` and ${extractorResult.warningCount} warnings`
		);
	}
}

async function main() {
	const outputDir = path.join(__dirname, "../dist");

	await fs.ensureDir(outputDir);

	await bundle({
		out: path.join(outputDir, "index.min.js"),
		minify: true,
		entryPoint: "lib/index.js",
	});

	await extractApi();
}

main();
