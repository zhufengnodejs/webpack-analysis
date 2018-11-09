#!/usr/bin/env node
//使用node命令执行此脚本
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

(function () {
	// wrap in IIFE to be able to use return
	//包装在一个自执行函数中以便使用return关键字
	const importLocal = require("import-local");
	// Prefer the local installation of webpack-cli
	//更倾向于本地安装,如果本地找到了webpack-cli则优先安装本地模块 

	if (importLocal(__filename)) {
		return;
	}
	//这个包可以给require追加一个钩子用来使用V8的代码缓存来加速安装时间,所谓的代码缓存是V8做的解析和编译工作 
	require("v8-compile-cache");
	//错误帮助模块
	const ErrorHelpers = require("./errorHelpers");

	const NON_COMPILATION_ARGS = [
		"init",
		"migrate",
		"add",
		"remove",
		/*
		"update",
		"make",
		*/
		"serve",
		"generate-loader",
		"generate-plugin",
		"info"
	];
	//逐个解析参数,只保留指定的选项
	const NON_COMPILATION_CMD = process.argv.find(arg => {
		if (arg === "serve") {
			global.process.argv = global.process.argv.filter(a => a !== "serve");
			process.argv = global.process.argv;
		}
		return NON_COMPILATION_ARGS.find(a => a === arg);
	});

	if (NON_COMPILATION_CMD) {
		//开启一个新的子进程执行此命令,确定安装了webpack-cli
		return require("./prompt-command")(NON_COMPILATION_CMD, ...process.argv);
	}

	const yargs = require("yargs").usage(`webpack-cli ${
		require("../package.json").version
		}

Usage: webpack-cli [options]
       webpack-cli [options] --entry <entry> --output <output>
       webpack-cli [options] <entries...> --output <output>
       webpack-cli <command> [options]

For more information, see https://webpack.js.org/api/cli/.`);

	require("./config-yargs")(yargs);

	const DISPLAY_GROUP = "Stats options:";
	const BASIC_GROUP = "Basic options:";

	yargs.options({
		silent: {
			type: "boolean",//防止标准输出显示在控制上
			describe: "Prevent output from being displayed in stdout"
		},
		json: {
			type: "boolean",
			alias: "j",//把结果以JSON的形式进行输出
			describe: "Prints the result as JSON."
		},
		progress: {
			type: "boolean",//以百分比显示构建的进度
			describe: "Print compilation progress in percentage",
			group: BASIC_GROUP
		},
		color: {
			type: "boolean",
			alias: "colors",
			default: function supportsColor() {
				if (process.stdout.isTTY === true) {
					return require("supports-color").supportsColor;
				}
			},
			group: DISPLAY_GROUP,//启用或禁用控制台颜色
			describe: "Enables/Disables colors on the console"
		},
		"sort-modules-by": {
			type: "string",
			group: DISPLAY_GROUP,//用模块的名称进行排序
			describe: "Sorts the modules list by property in module"
		},
		"sort-chunks-by": {
			type: "string",
			group: DISPLAY_GROUP,//按代码块的名称进行排序 
			describe: "Sorts the chunks list by property in chunk"
		},
		"sort-assets-by": {
			type: "string",
			group: DISPLAY_GROUP,//按资源的名称排序 
			describe: "Sorts the assets list by property in asset"
		},
		"hide-modules": {
			type: "boolean",
			group: DISPLAY_GROUP,//隐藏模块信息
			describe: "Hides info about modules"
		},
		"display-exclude": {
			type: "string",
			group: DISPLAY_GROUP,//在输出中排除的模块
			describe: "Exclude modules in the output"
		},
		"display-modules": {
			type: "boolean",
			group: DISPLAY_GROUP,//在输出中即使排除了也可以显示出来
			describe: "Display even excluded modules in the output"
		},
		"display-max-modules": {
			type: "number",
			group: DISPLAY_GROUP,//设置输出中的显示 模块的最大数量
			describe: "Sets the maximum number of visible modules in output"
		},
		"display-chunks": {
			type: "boolean",
			group: DISPLAY_GROUP,//在输出中显示代码块
			describe: "Display chunks in the output"
		},
		"display-entrypoints": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示入口点
			describe: "Display entry points in the output"
		},
		"display-origins": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示输出的代码块的来源
			describe: "Display origins of chunks in the output"
		},
		"display-cached": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示缓存的模块
			describe: "Display also cached modules in the output"
		},
		"display-cached-assets": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示缓存的资源
			describe: "Display also cached assets in the output"
		},
		"display-reasons": {
			type: "boolean",
			group: DISPLAY_GROUP,//在输出中显示包含模块的原因
			describe: "Display reasons about module inclusion in the output"
		},
		"display-depth": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示每个模块距离入口模块的距离 
			describe: "Display distance from entry point for each module"
		},
		"display-used-exports": {
			type: "boolean",
			group: DISPLAY_GROUP,
			describe://显示使用到的模块，为了使用tree shaking
				"Display information about used exports in modules (Tree Shaking)"
		},
		"display-provided-exports": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示模块提供的输出信息
			describe: "Display information about exports provided from modules"
		},
		"display-optimization-bailout": {
			type: "boolean",
			group: DISPLAY_GROUP,
			describe://显示 为什么模块优化失败信息
				"Display information about why optimization bailed out for modules"
		},
		"display-error-details": {
			type: "boolean",
			group: DISPLAY_GROUP,//显示 错误的详细信息
			describe: "Display details about errors"
		},
		display: {
			type: "string",
			choices: [
				"",
				"verbose",
				"detailed",
				"normal",
				"minimal",
				"errors-only",
				"none"
			],
			group: DISPLAY_GROUP,//显示日志的级别
			describe: "Select display preset"
		},
		verbose: {
			type: "boolean",
			group: DISPLAY_GROUP,
			describe: "Show more details"//显示更多的日志
		},
		"info-verbosity": {
			type: "string",
			default: "info",
			choices: ["none", "info", "verbose"],
			group: DISPLAY_GROUP,
			describe://控制生命周期信息的输出
				"Controls the output of lifecycle messaging e.g. Started watching files..."
		},
		"build-delimiter": {
			type: "string",
			group: DISPLAY_GROUP,//在构建输出完毕后显示自定义的文本
			describe: "Display custom text after build output"
		}
	});

	// yargs will terminate the process early when the user uses help or version.
	// This causes large help outputs to be cut short (https://github.com/nodejs/node/wiki/API-changes-between-v0.10-and-v4#process).
	// To prevent this we use the yargs.parse API and exit the process normally
	yargs.parse(process.argv.slice(2), (err, argv, output) => {
		Error.stackTraceLimit = 30;

		// arguments validation failed 参数验证失败
		if (err && output) {
			console.error(output);
			process.exitCode = 1;
			return;
		}

		// help or version info 帮助或者版本信息
		if (output) {
			console.log(output);
			return;
		}

		if (argv.verbose) { //是否显示冗余日志
			argv["display"] = "verbose";
		}

		let options;
		try {//合并配置文件参数和命令行参数获得最后的配置对象
			options = require("./convert-argv")(argv);
		} catch (err) {
			if (err.name !== "ValidationError") {
				throw err;
			}

			const stack = ErrorHelpers.cleanUpWebpackOptions(err.stack, err.message);
			const message = err.message + "\n" + stack;

			if (argv.color) {
				console.error(`\u001b[1m\u001b[31m${message}\u001b[39m\u001b[22m`);
			} else {
				console.error(message);
			}

			process.exitCode = 1;
			return;
		}

		/**
		 * When --silent flag is present, an object with a no-op write method is
		 * used in place of process.stout
		 */
		const stdout = argv.silent
			? {
				write: () => { }
			} // eslint-disable-line
			: process.stdout;

		function ifArg(name, fn, init) {
			if (Array.isArray(argv[name])) {
				if (init) init();
				argv[name].forEach(fn);
			} else if (typeof argv[name] !== "undefined") {
				if (init) init();
				fn(argv[name], -1);
			}
		}

		function processOptions(options) {
			// process Promise
			if (typeof options.then === "function") {
				options.then(processOptions).catch(function (err) {
					console.error(err.stack || err);
					process.exit(1); // eslint-disable-line
				});
				return;
			}

			const firstOptions = [].concat(options)[0];
			const statsPresetToOptions = require("webpack").Stats.presetToOptions;

			let outputOptions = options.stats;
			if (
				typeof outputOptions === "boolean" ||
				typeof outputOptions === "string"
			) {
				outputOptions = statsPresetToOptions(outputOptions);
			} else if (!outputOptions) {
				outputOptions = {};
			}

			ifArg("display", function (preset) {
				outputOptions = statsPresetToOptions(preset);
			});

			outputOptions = Object.create(outputOptions);
			if (Array.isArray(options) && !outputOptions.children) {
				outputOptions.children = options.map(o => o.stats);
			}
			if (typeof outputOptions.context === "undefined")
				outputOptions.context = firstOptions.context;

			ifArg("env", function (value) {
				if (outputOptions.env) {
					outputOptions._env = value;
				}
			});

			ifArg("json", function (bool) {
				if (bool) {
					outputOptions.json = bool;
					outputOptions.modules = bool;
				}
			});

			if (
				typeof outputOptions.colors === "undefined" &&
				process.stdout.isTTY === true
			)
				outputOptions.colors = require("supports-color").stdout;

			ifArg("sort-modules-by", function (value) {
				outputOptions.modulesSort = value;
			});

			ifArg("sort-chunks-by", function (value) {
				outputOptions.chunksSort = value;
			});

			ifArg("sort-assets-by", function (value) {
				outputOptions.assetsSort = value;
			});

			ifArg("display-exclude", function (value) {
				outputOptions.exclude = value;
			});

			if (!outputOptions.json) {
				if (typeof outputOptions.cached === "undefined")
					outputOptions.cached = false;
				if (typeof outputOptions.cachedAssets === "undefined")
					outputOptions.cachedAssets = false;

				ifArg("display-chunks", function (bool) {
					if (bool) {
						outputOptions.modules = false;
						outputOptions.chunks = true;
						outputOptions.chunkModules = true;
					}
				});

				ifArg("display-entrypoints", function (bool) {
					outputOptions.entrypoints = bool;
				});

				ifArg("display-reasons", function (bool) {
					if (bool) outputOptions.reasons = true;
				});

				ifArg("display-depth", function (bool) {
					if (bool) outputOptions.depth = true;
				});

				ifArg("display-used-exports", function (bool) {
					if (bool) outputOptions.usedExports = true;
				});

				ifArg("display-provided-exports", function (bool) {
					if (bool) outputOptions.providedExports = true;
				});

				ifArg("display-optimization-bailout", function (bool) {
					if (bool) outputOptions.optimizationBailout = bool;
				});

				ifArg("display-error-details", function (bool) {
					if (bool) outputOptions.errorDetails = true;
				});

				ifArg("display-origins", function (bool) {
					if (bool) outputOptions.chunkOrigins = true;
				});

				ifArg("display-max-modules", function (value) {
					outputOptions.maxModules = +value;
				});

				ifArg("display-cached", function (bool) {
					if (bool) outputOptions.cached = true;
				});

				ifArg("display-cached-assets", function (bool) {
					if (bool) outputOptions.cachedAssets = true;
				});

				if (!outputOptions.exclude)
					outputOptions.exclude = [
						"node_modules",
						"bower_components",
						"components"
					];

				if (argv["display-modules"]) {
					outputOptions.maxModules = Infinity;
					outputOptions.exclude = undefined;
					outputOptions.modules = true;
				}
			}

			ifArg("hide-modules", function (bool) {
				if (bool) {
					outputOptions.modules = false;
					outputOptions.chunkModules = false;
				}
			});

			ifArg("info-verbosity", function (value) {
				outputOptions.infoVerbosity = value;
			});

			ifArg("build-delimiter", function (value) {
				outputOptions.buildDelimiter = value;
			});
			//引入webpack模块
			const webpack = require("webpack");

			let lastHash = null;
			let compiler;
			try {
				//通过调用webpack函数得到compiler对象
				compiler = webpack(options);
			} catch (err) {
				if (err.name === "WebpackOptionsValidationError") {
					if (argv.color)
						console.error(
							`\u001b[1m\u001b[31m${err.message}\u001b[39m\u001b[22m`
						);
					else console.error(err.message);
					// eslint-disable-next-line no-process-exit
					process.exit(1);
				}

				throw err;
			}

			if (argv.progress) {//如果要显示进度的话
				const ProgressPlugin = require("webpack").ProgressPlugin;
				new ProgressPlugin({
					profile: argv.profile
				}).apply(compiler);
			}
			if (outputOptions.infoVerbosity === "verbose") {
				if (argv.w) {
					compiler.hooks.watchRun.tap("WebpackInfo", compilation => {
						const compilationName = compilation.name ? compilation.name : "";
						console.log("\nCompilation " + compilationName + " starting…\n");
					});
				} else {
					compiler.hooks.beforeRun.tap("WebpackInfo", compilation => {
						const compilationName = compilation.name ? compilation.name : "";
						console.log("\nCompilation " + compilationName + " starting…\n");
					});
				}
				compiler.hooks.done.tap("WebpackInfo", compilation => {
					const compilationName = compilation.name ? compilation.name : "";
					console.log("\nCompilation " + compilationName + " finished\n");
				});
			}

			function compilerCallback(err, stats) {
				if (!options.watch || err) {
					// Do not keep cache anymore
					compiler.purgeInputFileSystem();
				}
				if (err) {
					lastHash = null;
					console.error(err.stack || err);
					if (err.details) console.error(err.details);
					process.exit(1); // eslint-disable-line
				}
				if (outputOptions.json) {
					stdout.write(
						JSON.stringify(stats.toJson(outputOptions), null, 2) + "\n"
					);
				} else if (stats.hash !== lastHash) {
					lastHash = stats.hash;
					if (stats.compilation && stats.compilation.errors.length !== 0) {
						const errors = stats.compilation.errors;
						if (errors[0].name === "EntryModuleNotFoundError") {
							console.error(
								"\n\u001b[1m\u001b[31mInsufficient number of arguments or no entry found."
							);
							console.error(
								"\u001b[1m\u001b[31mAlternatively, run 'webpack(-cli) --help' for usage info.\u001b[39m\u001b[22m\n"
							);
						}
					}
					const statsString = stats.toString(outputOptions);
					const delimiter = outputOptions.buildDelimiter
						? `${outputOptions.buildDelimiter}\n`
						: "";
					if (statsString) stdout.write(`${statsString}\n${delimiter}`);
				}
				if (!options.watch && stats.hasErrors()) {
					process.exitCode = 2;
				}
			}
			if (firstOptions.watch || options.watch) {
				const watchOptions =
					firstOptions.watchOptions ||
					firstOptions.watch ||
					options.watch ||
					{};
				if (watchOptions.stdin) {
					process.stdin.on("end", function (_) {
						process.exit(); // eslint-disable-line
					});
					process.stdin.resume();
				}
				compiler.watch(watchOptions, compilerCallback);
				if (outputOptions.infoVerbosity !== "none")
					console.log("\nwebpack is watching the files…\n");
			} else {
				//此处是开始真正开始执行编译
				compiler.run(compilerCallback);
			}
		}
		//开始解析参数，然后进行编译
		processOptions(options);
	});
})();
