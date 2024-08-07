<!-- Generated with rules_docgen: http://github.com/aspect-build/rules_docgen -->

{{{doc.moduleDocstring}}}

{{#if doc.ruleInfo}}
Rules
=====

{{#each doc.ruleInfo}}

## {{this.ruleName}}

{{{this.docString}}}

{{#unless (hasLoadStatement this.docString this.ruleName)}}
{{#with ../sourcemap.load as | loadTgt |}}

Example usage (generated):

```python
load("{{loadTgt}}", "{{../ruleName}}")

{{../ruleName}}(
    {{#each ../attribute}}
    {{#if this.mandatory}}
    # {{firstLine this.docString}}
    {{this.name}} = {{placeholder this.type}},
    {{/if}}
    {{/each}}
)
```

{{/with}}
{{/unless}}
{{#each this.attribute}}

### {{this.name}}

{{mandatoryString this.mandatory}} {{attributeType this.type}}.
{{#if this.defaultValue}}Default: `{{{this.defaultValue}}}`{{/if}}

{{#each this.providerNameGroup}}[Must provide `{{this.providerName}}`] {{/each}}

{{{this.docString}}}

{{/each}}
{{/each}}

{{/if}}

{{#if doc.funcInfo}}

# Macros and Functions

{{#each doc.funcInfo}}

## {{this.functionName}}

{{{this.docString}}}

{{#unless (hasLoadStatement this.docString this.functionName)}}
{{#with ../sourcemap.load as | loadTgt |}}

Example usage (generated):

```python
load("{{loadTgt}}", "{{macroLoadSymbol ../functionName}}")

{{../functionName}}(
    {{#each ../parameter}}
    {{#if this.mandatory}}
    {{#with this.docString as |doc|}}
    # {{firstLine doc}}
    {{/with}}
    {{this.name}} = {{{ parameterPlaceholder this.name }}},
    {{/if}}
    {{/each}}
)
```

{{/with}} {{/unless}}
{{#each this.parameter}}

### {{this.name}}

{{mandatoryString this.mandatory}}. {{#if this.defaultValue}}Default: `{{{this.defaultValue}}}`{{/if}}

{{{this.docString}}}

{{#if this.return.docString}}Returns: {{this.return.docString}}{{/if}}

{{#if this.deprecated.docString}}Deprecated: {{this.deprecated.docString}} {{/if}}
{{/each}}
{{/each}}
{{/if}}

{{#if doc.providerInfo}}
Providers
=========

{{#each doc.providerInfo}}

## {{this.providerName}}

{{{this.docString}}}
{{/each}}

{{/if}}

{{#if doc.aspectInfo}}
Aspects
=======

{{#each doc.aspectInfo}}

## {{this.aspectName}}

{{{this.docString}}}

Propagates along attributes named:
`{{this.aspectAttribute}}`
{{#each this.attribute}}

### {{this.name}}

{{mandatoryString this.mandatory}} {{attributeType this.type}}
{{#if this.defaultValue}}Default: `{{{this.defaultValue}}}`{{/if}}

{{#each this.providerNameGroup}} [Must provide `{{this.providerName}}`] {{/each}}

{{{this.docString}}}
{{/each}}
{{/each}}
{{/if}}
