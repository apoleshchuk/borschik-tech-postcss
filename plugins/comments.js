const postcss = require("postcss");

module.exports = () => {
    return styles => {
        styles.walkAtRules(rule => {
            if (rule.name !== "import") {
                return;
            }

            rule.parent.insertBefore(
                rule,
                postcss.comment({
                    text: rule.params.toString() + ": begin"
                })
            );
            rule.parent.insertAfter(
                rule,
                postcss.comment({ text: rule.params.toString() + ": end" })
            );
        });
    };
};
