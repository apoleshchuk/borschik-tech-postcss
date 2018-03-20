const base = require("borschik/lib/tech");
const { writeFile } = require("borschik/lib/util");
const { dirname } = require("path");
const postcss = require("postcss");

exports.Tech = base.Tech.inherit({
    __constructor: function(opts) {
        this.__base(opts);
        this.sourceMap = true;
        if (opts.techOptions.sourceMap !== undefined) {
            this.sourceMap = opts.techOptions.sourceMap;
        }
    },

    minimize(content) {
        return content.then(content => {
            return postcss([require("csswring")()]).process(
                content.css,
                content.opts
            );
        });
    },

    write(output, content) {
        const { sourceMap } = this;

        return content.then(result =>
            writeFile(output, result.css).then(() => {
                if (sourceMap && sourceMap !== true && !sourceMap.inline) {
                    return writeFile(output.path + ".map", result.map);
                }
            })
        );
    },

    File: (exports.File = base.File.inherit({
        process(path) {
            return postcss([
                require("./plugins/comments")(),
                require("postcss-import")({
                    path: [dirname(path)]
                }),
                require("./plugins/links")({
                    freeze: this.tech.opts.freeze
                })
            ]).process(this.content, {
                map: this.tech.sourceMap,
                from: path,
                to: this.tech.opts.output.path
            });
        }
    }))
});
