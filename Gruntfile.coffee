EXPORTED_FUNCTIONS = '-s EXPORTED_FUNCTIONS="[' + [
  '_main',
  '_LZ4JS_init'
  '_LZ4JS_createCompressionContext'
  '_LZ4JS_createDecompressionContext'
  '_LZ4JS_freeCompressionContext'
  '_LZ4JS_freeDecompressionContext'
  '_LZ4JS_compressBegin'
  '_LZ4JS_compressUpdate'
  '_LZ4JS_compressEnd'
  '_LZ4JS_decompress'
]
.map((name) -> "'#{name}'")
.join() + ']"'

C_FILES = [
  'src/lz4js.c'
].join(' ')

LIBS = [
  'lz4/lib/liblz4.a'
].join(' ')

INCLUDES = '-Ilz4/lib -Isrc'

POST_JS = '--post-js dev/post-compiled.js'

TOTAL_MEMORY = 32 * 1024 * 1024;

RELEASE_ARGS = [
  '-O3' # Max compiler optimization level 
  '--memory-init-file 0' # Do not generat ememoy init file (.mem)
  '--closure 1' # The closure compiler is used to minify Emscripten-generated code at higher optimisations.
  '--llvm-lto 1' # Enable lint-time-optimizations
  '-s NO_FILESYSTEM=1' # Remove filesystem functions, reduce output file sizes
  '-s EXTRA_EXPORTED_RUNTIME_METHODS=[]' # runtime methods to export
  "-s TOTAL_MEMORY=#{TOTAL_MEMORY}" # Amount of memory to be used. 
  "-s ENVIRONMENT=web,node" #declare environments
  "-s MODULARIZE=1" # wrap package in UMD
  # "-s ALLOW_MEMORY_GROWTH=1" # disables optimizations for asm.js, use only for WASM
  # "-s EXPORT_ES6=1"
  # "-s USE_ES6_IMPORT_META=0"
  "-s 'EXPORT_NAME=\"lz4\"'" # module name
]

WASM_RELEASE_ARGS = RELEASE_ARGS.concat([
  # WASM arguments
  "-s ALLOW_MEMORY_GROWTH=1" # Allows the total amount of memory used to change depending on the demands of the application
]).join(' ')

ASM_RELEASE_ARGS= RELEASE_ARGS.concat([
  # ASM.js arguments
  "-s WASM=0" # compile to asm.js instead .wasm
  "-s WASM_ASYNC_COMPILATION=0" # remove asynchronous wrappers. Module will be ready synchronously right after call
]).join(' ')

module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    exec:
      rollup:
        cmd: "npm run rollup"
      compileDev:
        cmd: "emcc #{INCLUDES} #{C_FILES} #{LIBS} -o dev/_lz4.js -s TOTAL_MEMORY=#{TOTAL_MEMORY} -s ENVIRONMENT=web,node #{EXPORTED_FUNCTIONS}"
      compileRelease:
        cmd: "emcc #{ASM_RELEASE_ARGS} #{INCLUDES} #{C_FILES} #{LIBS} -o _lz4.js #{POST_JS} -s TOTAL_MEMORY=#{TOTAL_MEMORY} #{EXPORTED_FUNCTIONS}"
      fetchLib:
        cmd: "git submodule update --init lz4"
      buildLib:
        cwd: 'lz4'
        cmd: "emmake make lib"

    concat:
      dev:
        src: ['dev/_lz4.js', 'dev/post-compiled.js']
        dest: 'dev/lz4.js'
      release:
        options:
          banner: '/*! lz4.js v<%= pkg.version %> Released under the MIT license. https://github.com/ukyo/lz4.js/LICENSE */'
        src: ['src/header.js', '_lz4.js', 'src/footer.js']
        dest: 'lz4.js'

    clean:
      release: ['_lz4.js']
      test: ['test/_dst1.txt', 'test/_dst2.txt']

    cafemocha:
      testDev:
        src: ['test/lz4Spec.js']

    watch:
      dev:
        files: ['src/post.js', 'Gruntfile.coffee']
        tasks: ['test:dev']

    mkdir:
      dev:
        options:
          create: ['dev']

  grunt.loadNpmTasks 'grunt-exec'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-cafe-mocha'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-mkdir'

  grunt.registerTask 'compile:dev', ['exec:compileDev']
  grunt.registerTask 'compile:release', ['exec:compileRelease']
  grunt.registerTask 'init', [
    'mkdir:dev'
    'exec:fetchLib'
    'exec:buildLib'
    'exec:rollup'
    'compile:dev'
  ]
  grunt.registerTask 'test:dev', [
    'exec:rollup'
    'concat:dev'
    'cafemocha:testDev'
    'clean:test'
  ]
  grunt.registerTask 'release', [
    'exec:rollup'
    'compile:release'
    'concat:release'
    'clean:release'
  ]
