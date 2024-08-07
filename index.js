import {ModuleInfoSchema} from '@buf/bazel_bazel.bufbuild_es/src/main/java/com/google/devtools/build/skydoc/rendering/proto/stardoc_output_pb.js'
import {readFileSync} from 'node:fs';
import {fromBinary} from '@bufbuild/protobuf'
const msg = fromBinary(ModuleInfoSchema, readFileSync(process.argv[2]));
console.log(msg.funcInfo[0].docString);
