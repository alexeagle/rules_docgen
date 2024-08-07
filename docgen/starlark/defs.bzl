# TODO: ship pre-compiled native binary like we do for rosetta
# so that we don't leak a nodejs dependency to users who don't use it?
load("@aspect_rules_js//js:defs.bzl", "js_run_binary")

def starlark_doc(name, src, out = None, deps = [], **kwargs):
    out = out or name + ".md"
    extract_target = "_{}.doc_extract".format(name)

    native.starlark_doc_extract(
        name = extract_target,
        src = src,
        deps = deps,
    )

    # query_target = "_{}.definition".format(name)
    # native.genquery(
    #     name = query_target,
    #     expression = Label(extract_target),
    #     scope = [Label(extract_target)],
    #     opts = ["--output=proto"],
    # )

    js_run_binary(
        name = name,
        srcs = [extract_target],
        tool = Label("//docgen/starlark:render"),
        env = {"RUNFILES_DIR": "."},
        args = ["$(rootpath {})".format(extract_target)],
        stdout = out,
    )
