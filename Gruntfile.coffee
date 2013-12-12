module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    exec:
      compileDev:
        cmd: '''emcc lz4/lz4.c -O2 lz4/xxhash.c -o dev/_lz4.js -s EXPORTED_FUNCTIONS="['_LZ4_compress', '_LZ4_decompress_safe', '_LZ4_compressBound', '_XXH32']"'''
      compileRelease:
        cmd: '''emcc -O2 --closure 1 lz4/lz4.c lz4/xxhash.c -o _lz4.js --pre-js src/pre.js --post-js src/post.js -s EXPORTED_FUNCTIONS="['_LZ4_compress', '_LZ4_decompress_safe', '_LZ4_compressBound', '_XXH32']"'''
      initLZ4:
        cmd: 'svn checkout http://lz4.googlecode.com/svn/trunk/ lz4'

    concat:
      dev:
        src: ['src/pre.js', 'dev/_lz4.js', 'src/post.js']
        dest: 'dev/lz4.js'
      release:
        options:
          banner: '/*! <%= pkg.name %> v<%= pkg.version %> Released under the MIT license. https://github.com/ukyo/lz4.js/LICENSE */'
        src: ['src/header.js', '_lz4.js', 'src/footer.js']
        dest: 'lz4.js'
      testDev:
        src: ['test/loadDev.js', 'test/lz4Spec.js']
        dest: 'test/lz4DevSpec.js'
      testRelease:
        src: ['test/loadRelease.js', 'test/lz4Spec.js']
        dest: 'test/lz4ReleaseSpec.js'

    clean:
      release: ['_lz4.js']
      test: ['<%= concat.testDev.dest %>', '<%= concat.testRelease.dest %>']

    cafemocha:
      testDev:
        src: ['<%= concat.testDev.dest %>']
      testRelease:
        src: ['<%= concat.testRelease.dest %>']

    watch:
      dev:
        files: ['src/pre.js', 'src/post.js', 'Gruntfile.coffee']
        tasks: ['concat:dev', 'test:dev']

  grunt.loadNpmTasks 'grunt-exec'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-cafe-mocha'
  grunt.loadNpmTasks 'grunt-contrib-clean'

  grunt.registerTask 'compile:dev', ['exec:compileDev']
  grunt.registerTask 'compile:release', ['exec:compileRelease']
  grunt.registerTask 'init', [
    'exec:initLZ4'
    'compile:dev'
  ]
  grunt.registerTask 'test:release', [
    'concat:testRelease'
    'cafemocha:testRelease'
    'clean:test'
  ]
  grunt.registerTask 'test:dev', [
    'concat:testDev'
    'cafemocha:testDev'
    'clean:test'
  ]
  grunt.registerTask 'release', [
    'compile:release'
    'concat:release'
    'test:release'
    'clean:release'
  ]