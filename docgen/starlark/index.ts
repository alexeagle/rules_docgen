import { setupHandlebars } from './handlebars.js';
import {ModuleInfoSchema} from '@buf/bazel_bazel.bufbuild_es/src/main/java/com/google/devtools/build/skydoc/rendering/proto/stardoc_output_pb.js'
import {readFileSync} from 'node:fs';
import {fromBinary} from '@bufbuild/protobuf'
import {pathToFileURL} from 'node:url';

export async function main(argv: string[]): Promise<0 | 1> {
    // Side-effects to setup our template engine, https://handlebarsjs.com
    const { templates } = setupHandlebars();
    const doc = fromBinary(ModuleInfoSchema, readFileSync(argv[0]))
    const content = templates.module(
        {doc},
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
