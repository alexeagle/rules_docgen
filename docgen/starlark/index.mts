import { setupHandlebars } from './handlebars.mjs';
import {targetToPath} from './fs.mjs';
import {ModuleInfoSchema} from '@buf/bazel_bazel.bufbuild_es/src/main/java/com/google/devtools/build/skydoc/rendering/proto/stardoc_output_pb.js';
import {Attribute, QueryResult, QueryResultSchema, Target} from '@buf/bazel_bazel.bufbuild_es/src/main/protobuf/build_pb.js';
import {readFileSync} from 'node:fs';
import {fromBinary} from '@bufbuild/protobuf'
import {pathToFileURL} from 'node:url';
import * as path from 'node:path';

// Support sourcemaps from documentation back to original declaration
interface SourceRef {
    // where users should typically load, e.g. @bazel_skylib//rules:thing.bzl
    load: string;
    // where the source lives relative to the git repository root, e.g. rules/thing.docs.bzl
    src: string;
}

function parseSourceMap(queryResult: QueryResult) {
    const result: Map<string, SourceRef> = new Map(
        queryResult.target.map((t: Target) => {
            let loadSymbolsFrom: string;
            // First see if this rule has a tag telling us where to load from
            const inputAttr = t.rule.attribute.find(
                (f: Attribute) => f.name === 'input'
            );
            const tagsAttr = t.rule.attribute.find(
                (f: Attribute) => f.name === 'tags'
            );
            const tags: string[] = tagsAttr.stringListValue;
            const loadFromDirective = tags.find((tag) =>
                tag.startsWith('load-from:')
            );
            if (loadFromDirective) {
                loadSymbolsFrom = loadFromDirective.substring(
                    'load-from:'.length
                );
            } else {
                if (inputAttr.stringValue.startsWith('@')) {
                    // Source is in a different repository, e.g. rules_foreign_cc
                    loadSymbolsFrom = inputAttr.stringValue;
                } else {
                    loadSymbolsFrom =
                        '@' +
                        'some-ruleset-name' +
                        inputAttr.stringValue;
                }

                // // Override with configured load statement replacements in case the generated
                // // one is incorrect (e.g., points to docs index, or internal rule rather than macro)
                // for (const [pattern, replace] of Object.entries(
                //     ruleset.cfg['load-source-mapping']
                // )) {
                //     const regex = new RegExp(pattern);
                //     if (loadSymbolsFrom.match(regex)) {
                //         loadSymbolsFrom =
                //             loadSymbolsFrom.replace(
                //                 regex,
                //                 replace as string
                //             );
                //         break;
                //     }
                // }
            }
            const outputs = t.rule.ruleOutput;
            if (outputs.length != 1) {
                throw new Error(
                    'stardoc rules are always expected to have one output'
                );
            }

            return [
                targetToPath(outputs[0]),
                {
                    src: path.join(
                        'workspace-root',
                        targetToPath(inputAttr.stringValue)
                    ),
                    load: loadSymbolsFrom,
                },
            ];
        })
    );
    return result;
}

export async function main(argv: string[]): Promise<0 | 1> {
    // Side-effects to setup our template engine, https://handlebarsjs.com
    const { templates } = setupHandlebars();

    const doc = fromBinary(ModuleInfoSchema, readFileSync(argv[0]))
    let moduleSourcemap = undefined;
    if (argv.length > 1) {
        const query = fromBinary(QueryResultSchema, readFileSync(argv[1]))
        moduleSourcemap = parseSourceMap(query);
    }
    
    const sourcemapLookup = (bazelBinPath: string): SourceRef | undefined => {
        if (!moduleSourcemap) return undefined;
        const result =
            moduleSourcemap.get(bazelBinPath) ||
            moduleSourcemap.get(bazelBinPath + '.md') ||
            moduleSourcemap.get(bazelBinPath + '.md_') ||
            moduleSourcemap.get(bazelBinPath + '.tmp');
        if (!result) {
            throw new Error(
                `all outputs should map back to a .bzl input, but no entry ${bazelBinPath} found in ${Array.from(
                    moduleSourcemap.keys()
                )}`
            );
        }
        return result;
    };
    const sourcemap = sourcemapLookup(
        'docs/tar-docgen.md'
    );
    const content = templates.module(
        {doc, sourcemap},
        {
            allowedProtoProperties: {
                docString: true,
                defaultValue: true,
                mandatory: true,
                moduleDocstring: true,
            },
        }
    );

    console.log(content);
    return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    (async () => (process.exitCode = await main(process.argv.slice(2))))();
}
