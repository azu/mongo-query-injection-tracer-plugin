import type { Schema } from "mongoose";
import { createTraverser } from "@deps/traverse";

export type mongoQueryInjectionTracerPluginOptions = {
    keyName: "sqlinjectiontest";
    logger?: Console;
};

export function mongoQueryInjectionTracerPlugin(options: mongoQueryInjectionTracerPluginOptions) {
    const keyName = options.keyName;
    const logger = options.logger ?? console;
    return (schema: Schema) => {
        const method = [
            "count",
            "find",
            "findOne",
            "findOneAndRemove",
            "findOneAndUpdate",
            "update",
            "updateOne",
            "updateMany"
        ] as const;
        const traverser = createTraverser();
        const queryChecker = (query: {}) => {
            traverser.visit(query, {
                enter({ node, prop }) {
                    Object.entries(node).forEach(([key, value]) => {
                        if (key === keyName || value === keyName) {
                            logger.trace(`${JSON.stringify(query, null, 4)} includes ${keyName} @ ${prop}`);
                        }
                    });
                }
            });
        };
        method.forEach(method => {
            schema.pre(method, function() {
                const query = this.getQuery();
                queryChecker(query);
            });
        });
    };
}
