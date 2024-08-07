"""These are some bazel rules.

The docstring is multiple lines.
"""

def _my_rule_impl(ctx):
    """Rule documentation

    Not outdented
    """
    return []

my_rule = rule(_my_rule_impl)

def my_macro(name, **kwargs):
    my_rule(name, **kwargs)
