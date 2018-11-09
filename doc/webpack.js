/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Compiler = require("./Compiler");
const MultiCompiler = require("./MultiCompiler");
//把 node.js 风格的文件系统应用到编译器。
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const WebpackOptionsDefaulter = require("./WebpackOptionsDefaulter");
const validateSchema = require("./validateSchema");
const WebpackOptionsValidationError = require("./WebpackOptionsValidationError");
const webpackOptionsSchema = require("../schemas/WebpackOptions.json");
const RemovedPluginError = require("./RemovedPluginError");
const version = require("../package.json").version;

/** @typedef {import("../declarations/WebpackOptions").WebpackOptions} WebpackOptions */

/**
 * @param {WebpackOptions} options options object
 * @param {function(Error=, Stats=): void=} callback callback
 * @returns {Compiler | MultiCompiler} the compiler object
 */
const webpack = (options, callback) => {
	const webpackOptionsValidationErrors = validateSchema(
		webpackOptionsSchema,
		options
	);
	if (webpackOptionsValidationErrors.length) {
		throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
	}
	let compiler;
	if (Array.isArray(options)) {
		compiler = new MultiCompiler(options.map(options => webpack(options)));
	} else if (typeof options === "object") {
		//将传入配置与默认配置合并
		options = new WebpackOptionsDefaulter().process(options);
		//将上下文传进编译器中编译
		compiler = new Compiler(options.context);
		//设置编译器的配置
		compiler.options = options;
		//使用node风格文件的系统编译
		new NodeEnvironmentPlugin().apply(compiler);
		//如果配置项有插件，安装插件
		if (options.plugins && Array.isArray(options.plugins)) {
			for (const plugin of options.plugins) {
				if (typeof plugin === "function") {
					plugin.apply(compiler);
				} else {
					plugin.apply(compiler);
				}
			}
		}
		//在environment环境配置的时候要执行的钩子
		compiler.hooks.environment.call();
		//在environment环境配置之后要执行的钩子
		compiler.hooks.afterEnvironment.call();
		//对大量的参数进行了处理，并注册了大量的编译所需要用到的插件
		compiler.options = new WebpackOptionsApply().process(options, compiler);
	} else {
		throw new Error("Invalid argument: options");
	}
	if (callback) {
		if (typeof callback !== "function") {
			throw new Error("Invalid argument: callback");
		}
		if (
			options.watch === true ||
			(Array.isArray(options) && options.some(o => o.watch))
		) {
			const watchOptions = Array.isArray(options)
				? options.map(o => o.watchOptions || {})
				: options.watchOptions || {};
			return compiler.watch(watchOptions, callback);
		}
		compiler.run(callback);
	}
	return compiler;
};

exports = module.exports = webpack;
exports.version = version;

webpack.WebpackOptionsDefaulter = WebpackOptionsDefaulter;
webpack.WebpackOptionsApply = WebpackOptionsApply;
webpack.Compiler = Compiler;
webpack.MultiCompiler = MultiCompiler;
webpack.NodeEnvironmentPlugin = NodeEnvironmentPlugin;
// @ts-ignore Global @this directive is not supported
webpack.validate = validateSchema.bind(this, webpackOptionsSchema);
webpack.validateSchema = validateSchema;
webpack.WebpackOptionsValidationError = WebpackOptionsValidationError;

const exportPlugins = (obj, mappings) => {
	for (const name of Object.keys(mappings)) {
		Object.defineProperty(obj, name, {
			configurable: false,
			enumerable: true,
			get: mappings[name]
		});
	}
};

exportPlugins(exports, {
	AutomaticPrefetchPlugin: () => require("./AutomaticPrefetchPlugin"),
	BannerPlugin: () => require("./BannerPlugin"),
	CachePlugin: () => require("./CachePlugin"),//向编译器加入缓存，用于缓存模块
	ContextExclusionPlugin: () => require("./ContextExclusionPlugin"),
	ContextReplacementPlugin: () => require("./ContextReplacementPlugin"),
	DefinePlugin: () => require("./DefinePlugin"),
	Dependency: () => require("./Dependency"),
	DllPlugin: () => require("./DllPlugin"),
	DllReferencePlugin: () => require("./DllReferencePlugin"),
	EnvironmentPlugin: () => require("./EnvironmentPlugin"),
	//通过包装在一个以// @ sourceURL注明的eval方法来包装每个模块模板。
	EvalDevToolModulePlugin: () => require("./EvalDevToolModulePlugin"),
	EvalSourceMapDevToolPlugin: () => require("./EvalSourceMapDevToolPlugin"),
	ExtendedAPIPlugin: () => require("./ExtendedAPIPlugin"),
	ExternalsPlugin: () => require("./ExternalsPlugin"),
	HashedModuleIdsPlugin: () => require("./HashedModuleIdsPlugin"),
	//添加模块热替换的支持。包装模板来添加运行时代码。添加module.hot的API。
	HotModuleReplacementPlugin: () => require("./HotModuleReplacementPlugin"),
	IgnorePlugin: () => require("./IgnorePlugin"),
	//入口块以一个类型为type的库name包装。
	LibraryTemplatePlugin: () => require("./LibraryTemplatePlugin"),
	LoaderOptionsPlugin: () => require("./LoaderOptionsPlugin"),
	LoaderTargetPlugin: () => require("./LoaderTargetPlugin"),
	MemoryOutputFileSystem: () => require("./MemoryOutputFileSystem"),
	Module: () => require("./Module"),
	ModuleFilenameHelpers: () => require("./ModuleFilenameHelpers"),
	NamedChunksPlugin: () => require("./NamedChunksPlugin"),
	NamedModulesPlugin: () => require("./NamedModulesPlugin"),
	NoEmitOnErrorsPlugin: () => require("./NoEmitOnErrorsPlugin"),
	NormalModuleReplacementPlugin: () =>
		require("./NormalModuleReplacementPlugin"),
	//预取request和依赖模块以便开启更多并行的编译过程。
	//它不会产生任何 chunk。该模块是根据context（绝对路径）的request解析的。
	PrefetchPlugin: () => require("./PrefetchPlugin"),
	//挂接进编译器以提取进度信息。handler必须具备这样的函数签名function(percentage, message)。
	//它会在0 <= percentage <= 1时被调用。percentage == 0表示开始。 percentage == 1表示结束。
	ProgressPlugin: () => require("./ProgressPlugin"),
	//如果name在一个模块中使用，它将由一个通过require(<request>)加载的模块填充。
	ProvidePlugin: () => require("./ProvidePlugin"),
	SetVarMainTemplatePlugin: () => require("./SetVarMainTemplatePlugin"),
	//在编译期添加一个入口块。该块以chunkName命名，且只包含一个模块（加上依赖）。这个模块根据context（绝对路径）的request解析
	SingleEntryPlugin: () => require("./SingleEntryPlugin"),
	//通过为每个 chunk 生成一个 SourceMap 来包装模板
	SourceMapDevToolPlugin: () => require("./SourceMapDevToolPlugin"),
	Stats: () => require("./Stats"),
	Template: () => require("./Template"),
	UmdMainTemplatePlugin: () => require("./UmdMainTemplatePlugin"),
	WatchIgnorePlugin: () => require("./WatchIgnorePlugin")
});
exportPlugins((exports.dependencies = {}), {
	DependencyReference: () => require("./dependencies/DependencyReference")
});
exportPlugins((exports.optimize = {}), {
	AggressiveMergingPlugin: () => require("./optimize/AggressiveMergingPlugin"),
	AggressiveSplittingPlugin: () =>
		require("./optimize/AggressiveSplittingPlugin"),
	ChunkModuleIdRangePlugin: () =>
		require("./optimize/ChunkModuleIdRangePlugin"),
	//合并的分块的限制数量需小于options.maxChunks
	LimitChunkCountPlugin: () => require("./optimize/LimitChunkCountPlugin"),
	//合并分块直到每个分块大小不小于minChunkSize。
	MinChunkSizePlugin: () => require("./optimize/MinChunkSizePlugin"),
	ModuleConcatenationPlugin: () =>
		require("./optimize/ModuleConcatenationPlugin"),
	OccurrenceOrderPlugin: () => require("./optimize/OccurrenceOrderPlugin"),
	OccurrenceModuleOrderPlugin: () =>
		require("./optimize/OccurrenceModuleOrderPlugin"),
	OccurrenceChunkOrderPlugin: () =>
		require("./optimize/OccurrenceChunkOrderPlugin"),
	RuntimeChunkPlugin: () => require("./optimize/RuntimeChunkPlugin"),
	SideEffectsFlagPlugin: () => require("./optimize/SideEffectsFlagPlugin"),
	SplitChunksPlugin: () => require("./optimize/SplitChunksPlugin")
});
exportPlugins((exports.web = {}), {
	FetchCompileWasmTemplatePlugin: () =>
		require("./web/FetchCompileWasmTemplatePlugin"),
	//chunk 被包装成 JSONP 回调。一个加载算法被包含进入口块，其通过添加一个<script>标签加载分块。
	JsonpTemplatePlugin: () => require("./web/JsonpTemplatePlugin")
});
exportPlugins((exports.webworker = {}), {
	//分块是由importScripts加载。否则它类似于JsonpTemplatePlugin。
	WebWorkerTemplatePlugin: () => require("./webworker/WebWorkerTemplatePlugin")
});
exportPlugins((exports.node = {}), {
	//分块被包装成Node.js的模块，并输出捆绑了的模块。入口块通过引用它们来加载分块。
	NodeTemplatePlugin: () => require("./node/NodeTemplatePlugin"),
	ReadFileCompileWasmTemplatePlugin: () =>
		require("./node/ReadFileCompileWasmTemplatePlugin")
});
exportPlugins((exports.debug = {}), {
	ProfilingPlugin: () => require("./debug/ProfilingPlugin")
});
exportPlugins((exports.util = {}), {
	createHash: () => require("./util/createHash")
});

const defineMissingPluginError = (namespace, pluginName, errorMessage) => {
	Object.defineProperty(namespace, pluginName, {
		configurable: false,
		enumerable: true,
		get() {
			throw new RemovedPluginError(errorMessage);
		}
	});
};

// TODO remove in webpack 5
defineMissingPluginError(
	exports.optimize,
	"UglifyJsPlugin",//使用uglify.js压缩分块
	"webpack.optimize.UglifyJsPlugin has been removed, please use config.optimization.minimize instead."
);

// TODO remove in webpack 5
defineMissingPluginError(
	exports.optimize,
	"CommonsChunkPlugin",
	"webpack.optimize.CommonsChunkPlugin has been removed, please use config.optimization.splitChunks instead."
);
