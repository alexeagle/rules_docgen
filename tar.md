<!-- Generated with rules_docgen: http://github.com/aspect-build/rules_docgen -->

General-purpose rule to create tar archives.

Unlike [pkg_tar from rules_pkg](https://github.com/bazelbuild/rules_pkg/blob/main/docs/latest.md#pkg_tar):

- It does not depend on any Python interpreter setup
- The "manifest" specification is a mature public API and uses a compact tabular format, fixing
  https://github.com/bazelbuild/rules_pkg/pull/238
- It doesn't rely custom program to produce the output, instead
  we rely on the well-known C++ program called "tar".
  Specifically, we use the BSD variant of tar since it provides a means
  of controlling mtimes, uid, symlinks, etc.

We also provide full control for tar'ring binaries including their runfiles.

The `tar` binary is hermetic and fully statically-linked.
It is fetched as a toolchain from https://github.com/aspect-build/bsdtar-prebuilt.

## Examples

See the [`tar` tests](/lib/tests/tar/BUILD.bazel) for examples of usage.

## Mutating the tar contents

The `mtree_spec` rule can be used to create an mtree manifest for the tar file.
Then you can mutate that spec using `mtree_mutate` and feed the result
as the `mtree` attribute of the `tar` rule.

For example, to set the owner uid of files in the tar, you could:

```starlark
_TAR_SRCS = ["//some:files"]

mtree_spec(
    name = "mtree",
    srcs = _TAR_SRCS,
)

mtree_mutate(
    name = "change_owner",
    mtree = ":mtree",
    owner = "1000",
)

tar(
    name = "tar",
    srcs = _TAR_SRCS,
    mtree = "change_owner",
)
```

TODO:
- Provide convenience for rules_pkg users to re-use or replace pkg_files trees

Rules
=====


## mtree_spec

Create an mtree specification to map a directory hierarchy. See https://man.freebsd.org/cgi/man.cgi?mtree(8)


Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "mtree_spec")

mtree_spec(
    # A unique name for this target.
    name = "",
)
```


### name

Required <a href="https://bazel.build/docs/build-ref.html#name">name</a>.




A unique name for this target.


### srcs

Optional <a href="https://bazel.build/docs/build-ref.html#labels">list of labels</a>.
Default: `[]`



Files that are placed into the tar


### out

Optional <a href="https://bazel.build/docs/build-ref.html#labels">label</a>.
Default: `None`



Resulting specification file to write


## tar_rule

Rule that executes BSD `tar`. Most users should use the [`tar`](#tar) macro, rather than load this directly.


Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "tar_rule")

tar_rule(
    # A unique name for this target.
    name = "",
    # An mtree specification file
    mtree = "",
)
```


### name

Required <a href="https://bazel.build/docs/build-ref.html#name">name</a>.




A unique name for this target.


### args

Optional list of strings.
Default: `[]`



Additional flags permitted by BSD tar; see the man page.


### srcs

Optional <a href="https://bazel.build/docs/build-ref.html#labels">list of labels</a>.
Default: `[]`



Files, directories, or other targets whose default outputs are placed into the tar.

If any of the srcs are binaries with runfiles, those are copied into the resulting tar as well.


### mode

Optional string.
Default: `"create"`



A mode indicator from the following list, copied from the tar manpage:

- create: Create a new archive containing the specified items.
- append: Like `create`, but new entries are appended to the archive.
     Note that this only works on uncompressed archives stored in regular files.
     The -f option is required.
- list: List  archive contents to stdout.
- update: Like `append`, but new entries are added only if they have a
     modification date newer than the corresponding entry in the archive.
        Note that this only works on uncompressed archives stored in
        regular files. The -f option     is required.
- extract: Extract to disk from the archive. If a file with the same name
        appears more than once in the archive, each copy  will  be  extracted,
    with  later  copies  overwriting  (replacing) earlier copies.


### mtree

Required <a href="https://bazel.build/docs/build-ref.html#labels">label</a>.




An mtree specification file


### out

Optional <a href="https://bazel.build/docs/build-ref.html#labels">label</a>.
Default: `None`



Resulting tar file to write. If absent, `[name].tar` is written.


### compress

Optional string.
Default: `""`



Compress the archive file with a supported algorithm.




# Macros and Functions


## tar_lib.common.add_compression_args




Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "tar_lib")

tar_lib.common.add_compression_args(
    compress = None,
    args = [],
)
```

 

### compress

Required. 







### args

Required. 







## tar_lib.implementation




Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "tar_lib")

tar_lib.implementation(
    ctx = None,
)
```

 

### ctx

Required. 







## tar_lib.mtree_implementation




Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "tar_lib")

tar_lib.mtree_implementation(
    ctx = None,
)
```

 

### ctx

Required. 







## tar

Wrapper macro around [`tar_rule`](#tar_rule).

### Options for mtree

mtree provides the "specification" or manifest of a tar file.
See https://man.freebsd.org/cgi/man.cgi?mtree(8)
Because BSD tar doesn't have a flag to set modification times to a constant,
we must always supply an mtree input to get reproducible builds.
See https://reproducible-builds.org/docs/archives/ for more explanation.

1. By default, mtree is "auto" which causes the macro to create an `mtree_spec` rule.

2. `mtree` may be supplied as an array literal of lines, e.g.

```
mtree =[
    "usr/bin uid=0 gid=0 mode=0755 type=dir",
    "usr/bin/ls uid=0 gid=0 mode=0755 time=0 type=file content={}/a".format(package_name()),
],
```

For the format of a line, see "There are four types of lines in a specification" on the man page for BSD mtree,
https://man.freebsd.org/cgi/man.cgi?mtree(8)

3. `mtree` may be a label of a file containing the specification lines.



Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "tar")

tar(
    # name of resulting `tar_rule`
    name = "",
)
```

 

### name

Required. 

name of resulting `tar_rule`





### mtree

Optional. Default: `"auto"`

"auto", or an array of specification lines, or a label of a file that contains the lines.
Subject to [$(location)](https://bazel.build/reference/be/make-variables#predefined_label_variables)
and ["Make variable"](https://bazel.build/reference/be/make-variables) substitution.





### stamp

Optional. Default: `0`

should mtree attribute be stamped





### kwargs

Optional. 

additional named parameters to pass to `tar_rule`





## mtree_mutate

Modify metadata in an mtree file.


Example usage (generated):

```python
load("@some-ruleset-name//lib:tar.bzl", "mtree_mutate")

mtree_mutate(
    # name of the target, output will be `[name].mtree`.
    name = "",
    # input mtree file, typically created by `mtree_spec`.
    mtree = None,
)
```

 

### name

Required. 

name of the target, output will be `[name].mtree`.





### mtree

Required. 

input mtree file, typically created by `mtree_spec`.





### strip_prefix

Optional. Default: `None`

prefix to remove from all paths in the tar. Files and directories not under this prefix are dropped.





### package_dir

Optional. Default: `None`

directory prefix to add to all paths in the tar.





### mtime

Optional. Default: `None`

new modification time for all entries.





### owner

Optional. Default: `None`

new uid for all entries.





### ownername

Optional. Default: `None`

new uname for all entries.





### awk_script

Optional. Default: `"@aspect_bazel_lib//lib/private:modify_mtree.awk"`

may be overridden to change the script containing the modification logic.





### kwargs

Optional. 

additional named parameters to genrule







