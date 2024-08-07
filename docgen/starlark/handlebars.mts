import Handlebars from 'handlebars';
import { readUtf } from './fs.mjs';
import {AttributeType} from '@buf/bazel_bazel.bufbuild_es/src/main/java/com/google/devtools/build/skydoc/rendering/proto/stardoc_output_pb.js'
import {runfiles} from '@bazel/runfiles';

/**
 * Side effects to make handlebars work.
 * See https://handlebarsjs.com/api-reference/
 * @returns compiled templates for rendering, and render helpers
 */
export function setupHandlebars() {
    Handlebars.registerHelper('markdown', function (this: any, options) {
        return new Handlebars.SafeString(Handlebars.marked(options.fn(this)));
    });

    Handlebars.registerHelper('shortVersion', function (val: string) {
        // convert 40-char git SHA to a 7-char prefix
        // technically you need the git history to know how long the prefix should be
        // but rulesets probably don't have thousands of commits
        if (/[0-9a-f]{40}/.test(val)) {
            return new Handlebars.SafeString(val.substring(0, 7));
        }
        return new Handlebars.SafeString(val);
    });

    /**
     * Extract the short "one-liner" documentation by trimming on things like newlines
     * or sentence breaks.
     */
    Handlebars.registerHelper('firstLine', function (val: string) {
        // fixme: if splitting on a sentence, we should preserve the trailing period
        return new Handlebars.SafeString(
            val.trimStart().split(/\.\s|\n|<br\/?>/)[0]
        );
    });

    Handlebars.registerHelper('mandatoryString', function (val: boolean) {
        return val ? 'Required' : 'Optional';
    });

    /**
     * Test whether a rule or macro's docstring contains a load statement.
     */
    Handlebars.registerHelper(
        'hasLoadStatement',
        function (docString: string, ruleOrMacroName: string): boolean {
            ruleOrMacroName = macroNameToOuterStruct(ruleOrMacroName);
            return new RegExp(
                `\`\`\`[\\s\\S]*?load\\(.*?['"]${ruleOrMacroName}['"]\\)`
            ).test(docString);
        }
    );

    /**
     * Determine a placeholder value for a macro parameter where type info isn't available.
     * Note, must be used inside of a triple-stash expression {{{ }}} so that quotation marks
     * aren't escaped.
     */
    Handlebars.registerHelper(
        'parameterPlaceholder',
        (parameterName: string): string => {
            let placeholder: string | undefined;
            switch (parameterName) {
                case 'name':
                case 'src':
                case 'out':
                case 'in':
                case 'file':
                case 'deprecation':
                case 'size':
                case 'timeout':
                case 'param':
                case 'toolchain':
                    placeholder = '""';
                    break;
                case 'args':
                case 'srcs':
                case 'deps':
                case 'data':
                case 'outs':
                case 'include':
                case 'tags':
                case 'compatible_with':
                case 'distribs':
                case 'exec_compatible_with':
                case 'features':
                case 'restricted_to':
                case 'target_compatible_with':
                case 'toolchains':
                case 'visibility':
                case 'env_inherit':
                    placeholder = '[]';
                    break;
                case 'exec_properties':
                case 'env':
                    placeholder = '{}';
                    break;
                case 'testonly':
                case 'flaky':
                case 'local':
                    placeholder = 'False';
                    break;
                case 'ctx':
                    placeholder = 'None';
                    break;
                case 'shard_count':
                    placeholder = '0';
                    break;
            }

            if (!placeholder) {
                if (parameterName.endsWith('_file')) {
                    placeholder = '""';
                } else if (parameterName.endsWith('_files')) {
                    placeholder = '[]';
                } else {
                    // Fallback to None when we can't infer a type
                    placeholder = 'None';
                }
            }

            return placeholder!;
        }
    );

    
    /* Sometimes we get the full name of a macro within a struct, e.g., "paths.dirname".
       In this case the load string is just the name of the outer struct.
    */
    Handlebars.registerHelper('macroLoadSymbol', macroNameToOuterStruct);

    function macroNameToOuterStruct(functionName: string): string {
        const index = functionName.indexOf('.');
        return index >= 0 ? functionName.substring(0, index) : functionName;
    }

    // port of https://github.com/bazelbuild/bazel/blob/09c621e4cf5b968f4c6cdf905ab142d5961f9ddc/src/main/java/com/google/devtools/build/skydoc/rendering/MarkdownUtil.java#L248-L282
    function attributeTypeDescription(attributeType: number): string {
        switch (AttributeType[attributeType]) {
            case 'NAME':
                return 'name';
            case 'INT':
                return 'integer';
            case 'LABEL':
                return 'label';
            case 'STRING':
                return 'string';
            case 'STRING_LIST':
                return 'list of strings';
            case 'INT_LIST':
                return 'list of integers';
            case 'LABEL_LIST':
                return 'list of labels';
            case 'BOOLEAN':
                return 'boolean';
            case 'LABEL_STRING_DICT':
                return 'dictionary: Label → String';
            case 'STRING_DICT':
                return 'dictionary: String → String';
            case 'STRING_LIST_DICT':
                return 'dictionary: String → List of strings';
            case 'OUTPUT':
                return 'label';
            case 'OUTPUT_LIST':
                return 'list of labels';
            case 'UNKNOWN':
            case 'UNRECOGNIZED':
                throw new Error('unknown attribute type ' + attributeType);
        }
        throw new Error('unknown attribute type ' + attributeType);
    }

    // port of https://github.com/bazelbuild/bazel/blob/09c621e4cf5b968f4c6cdf905ab142d5961f9ddc/src/main/java/com/google/devtools/build/skydoc/rendering/MarkdownUtil.java#L191-L221
    Handlebars.registerHelper(
        'attributeType',
        function (attributeType: number) {
            let typeLink: string | undefined;
            switch (AttributeType[attributeType]) {
                case 'LABEL':
                case 'LABEL_LIST':
                case 'OUTPUT':
                    typeLink = 'https://bazel.build/docs/build-ref.html#labels';
                    break;
                case 'NAME':
                    typeLink = 'https://bazel.build/docs/build-ref.html#name';
                    break;
                case 'STRING_DICT':
                case 'STRING_LIST_DICT':
                case 'LABEL_STRING_DICT':
                    typeLink = 'https://bazel.build/docs/skylark/lib/dict.html';
                    break;
            }

            if (!!typeLink) {
                return new Handlebars.SafeString(
                    `<a href="${typeLink}">${attributeTypeDescription(
                        attributeType
                    )}</a>`
                );
            }

            return attributeTypeDescription(attributeType);
        }
    );

    /**
     * rendering helper
     * @param attributeType the starlark type
     * @returns the default value for that type
     */
    function attributeTypePlaceholder(attributeType: number): string {
        switch (AttributeType[attributeType]) {
            case 'INT':
                return '0';
            case 'NAME':
            case 'LABEL':
            case 'STRING':
            case 'OUTPUT':
                return '""';
            case 'STRING_LIST':
            case 'INT_LIST':
            case 'LABEL_LIST':
            case 'OUTPUT_LIST':
                return '[]';
            case 'BOOLEAN':
                return 'false';
            case 'LABEL_STRING_DICT':
            case 'STRING_DICT':
            case 'STRING_LIST_DICT':
                return '{}';
            case 'UNKNOWN':
            case 'UNRECOGNIZED':
                throw new Error('unknown attribute type ' + attributeType);
        }
        throw new Error('unknown attribute type ' + attributeType);
    }

    Handlebars.registerHelper('placeholder', function (attributeType: number) {
        return new Handlebars.SafeString(
            attributeTypePlaceholder(attributeType)
        );
    });

    /**
     * Return object: all the compiled templates, ready to render with a data object
     */
    const templates = {
        module: Handlebars.compile(readUtf(
            '/Users/alexeagle/Projects/try_buf/docgen/starlark/templates/module.md',
            // FIXME
            // runfiles.resolveWorkspaceRelative('docgen/starlark/templates/module.md')
        )),
    };

    return { templates };
}
