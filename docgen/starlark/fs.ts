/**
 * @fileoverview Helper functions for working with files
 */

import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'fs';
import { dirname, parse, join as pathJoin, relative, resolve } from 'path';

export const DIST_PATH = '../docs';

export { readFileSync };

export function mkdirp(path: string) {
    if (!existsSync(dirname(path))) mkdirp(dirname(path));
    if (!existsSync(path)) mkdirSync(path);
}

export function join(...segments: Array<string | undefined>) {
    const filtered: string[] = segments.filter((s) => !!s) as string[];
    return pathJoin(...filtered);
}

export function write(path: string, content: string) {
    const target = join(DIST_PATH, path);
    mkdirp(dirname(target));
    writeFileSync(target, content);
}

export function readUtf(path: string) {
    return readFileSync(path, { encoding: 'utf8' });
}

export function trimPrefix(s: string, prefix: string) {
    if (s.startsWith(prefix + '/')) {
        return s.substring(prefix.length + 1);
    }
    if (s.startsWith(prefix)) {
        return s.substring(prefix.length);
    }
    return s;
}

/**
 * Convert //docs:some.md -> docs/some.md
 * @param target a bazel target label representing an InputArtifact
 * @returns the path to that target in the repo
 */
export function targetToPath(target: string): string {
    if (target.startsWith('//:')) return target.substring(3);
    return target.substring(2).replace(':', '/');
}

/**
 *
 * Recursively search within a given subdirectory
 * until a file with the matching file name is found.
 *
 * @param dir The directory to search within
 * @param fileName The name of the file to look for (with extension)
 * @returns The path to the found file relative to dir. If multiple such files
 *          exist, returns the first match.
 */
export function searchForFileRecursively(
    dir: string,
    fileName: string
): string | null {
    // Validate that dir exists
    if (!existsSync(dir)) {
        return null;
    }
    let pathToMatchingFile = null;

    // Read contents of directory (return null if no match is found)
    readdirSync(dir)
        .map((d) => resolve(dir, d))
        .forEach((dirInner) => {
            // Get stats to determine if path is a directory or a file
            const stat = statSync(dirInner);

            // If path is a directory, recurse into it
            if (stat.isDirectory()) {
                const result = searchForFileRecursively(dirInner, fileName);
                if (result) {
                    pathToMatchingFile = result;
                }
            }

            // If path exists in the /data folder, return the match
            const fileNameSegments = transformToPosixPath(dirInner).split('/');
            if (fileNameSegments) {
                const candidateFileName =
                    fileNameSegments[fileNameSegments.length - 1];
                if (stat.isFile() && candidateFileName == fileName) {
                    pathToMatchingFile = dirInner;
                }
            }
        });

    return pathToMatchingFile;
}

/**
 * On Windows, the path separator is '\', so we convert these to '/' to be
 * POSIX-compatible.
 *
 * @param path The path to convert
 */

export function transformToPosixPath(path: string) {
    return path.replace(/\\/g, '/');
}

/**
 * Extracts the relative path from an absolute path given a root directory.
 *
 * @returns The relative path if it is different from the absolute path, else null
 *
 * @param path The absolute path
 * @param root The root directory
 */
export function getRelativePathFromRoot(path: string, root: string) {
    const relativePath = transformToPosixPath(relative(root, path));
    if (relativePath.startsWith('..')) {
        // path is not relative to root
        return null;
    }
    return relativePath;
}

/**
 * Extracts the file name (including extension) from a path to a file
 *
 * @param path
 */
export function getFileNameFromPath(path: string) {
    return parse(path).base;
}
