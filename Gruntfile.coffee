EXPORTED_FUNCTIONS = '-s EXPORTED_FUNCTIONS="[' + [
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

POST_JS = '--post-js src/post.js'

TOTAL_MEMORY = 32 * 1024 * 1024;

RELEASE_ARGS = [
  '-O3'
  '--memory-init-file 0'
  '--closure 1'
  '--llvm-lto 1'
  '-s NO_FILESYSTEM=1'
  '-s EXPORTED_RUNTIME_METHODS=[]'
  "-s TOTAL_MEMORY=#{TOTAL_MEMORY}"
].join(' ')

module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    exec:
      compileDev:
        cmd: "emcc #{INCLUDES} #{C_FILES} #{LIBS} -o dev/_lz4.js -s TOTAL_MEMORY=#{TOTAL_MEMORY} #{EXPORTED_FUNCTIONS}"
      compileRelease:
        cmd: "emcc #{RELEASE_ARGS} #{INCLUDES} #{C_FILES} #{LIBS} -o _lz4.js #{POST_JS} -s TOTAL_MEMORY=#{TOTAL_MEMORY} #{EXPORTED_FUNCTIONS}"
      fetchLib:
        cmd: "git submodule update --init lz4"
      buildLib:
        cwd: 'lz4'
        cmd: "emmake make lib"

    concat:
      dev:
        src: ['dev/_lz4.js', 'src/post.js']
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
    'compile:dev'
  ]
  grunt.registerTask 'test:dev', [
    'concat:dev'
    'cafemocha:testDev'
    'clean:test'
  ]
  grunt.registerTask 'release', [
    'compile:release'
    'concat:release'
    'clean:release'
  ]
