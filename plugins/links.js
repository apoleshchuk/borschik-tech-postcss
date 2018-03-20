const {
    isFreezableUrl,
    processPath,
    resolveUrl2
} = require("borschik/lib/freeze");
const { dirname, resolve, relative } = require("path");

const RE_INLINED_CONTENT = /^data:\w+\/[-+\w;]+,/;
const RE_PROTO_URL = /^(\w\+:)?\/\//;

const freeze = path => {
    const parts = path.match(/^([^?#]+)([?#]?.*)$/);
    let url = parts[1];

    if (isFreezableUrl(url)) {
        try {
            url = processPath(url);
            url = resolveUrl2(url);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    return url + parts[2];
};

const replaceUrl = (value, opts) => {
    const { dir, from, to } = opts;
    return require("reduce-function-call")(value, "url", function(value) {
        const parts = value.match(/^(['"]?)(.*)(\1)$/);
        let [, quotes, newPath] = parts;

        if (!RE_INLINED_CONTENT.test(newPath) && !RE_PROTO_URL.test(newPath)) {
            newPath = resolve(dir, newPath);
            newPath = relative(from, newPath);
            newPath = resolve(to, newPath);
            if (opts.freeze) {
                newPath = freeze(newPath);
            }
            newPath = resolveUrl2(newPath);
            quotes = quotes || '"';
        }

        return `url(${quotes}${newPath}${quotes})`;
    });
};

module.exports = opts => {
    return (styles, processOpts) => {
        const from = processOpts.from ? dirname(processOpts.from) : ".";
        const to = processOpts.to ? dirname(processOpts.to) : from;

        styles.walkAtRules(rule => {
            if (!rule.params) {
                return;
            }

            if (rule.params.indexOf("url(") == -1) {
                return;
            }
            const dir = dirname(rule.source.input.file);
            rule.params = replaceUrl(rule.params, { ...opts, dir, from, to });
        });

        styles.walkDecls(decl => {
            if (!decl.value) {
                return;
            }

            if (decl.value.indexOf("url(") == -1) {
                return;
            }

            // console.log(decl);

            const dir = dirname(decl.source.input.file);
            decl.value = replaceUrl(decl.value, { ...opts, dir, from, to });
        });
    };
};
