module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'public/libs/jquery.min.js',
                    'public/libs/bootstrap.min.js',
                    'public/libs/ng/angular.min.js',
                    'public/libs/ng/angular-ui-router.min.js',
                    'public/libs/ng/ngStorage.min.js',
                    'public/libs/ng/angular-notify.min.js',
                    'public/libs/ng/ng-file-upload-shim.min.js',
                    'public/libs/ng/ng-file-upload.min.js'
                ],
                dest: 'public/dist/<%= pkg.name %>.min.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                mangle: false
            },
            dist: {
                files: {
                    'public/dist/<%= pkg.name %>.minc.js': [
                        'public/front/frontApp.js',
                        'public/front/js/controllers/**/*.js',
                        'public/front/js/directive/**/*.js',
                        'public/services/**/*.js',
                        'public/front/js/dirPagination.js',
                        'public/front/js/angularjs-google-maps.js',
                    ]
                }
            }
        },
        cssmin: {
            dist: {
                options: {
                    shorthandCompacting: false,
                    roundingPrecision: -1
                },
                files: {
                    'public/dist/<%= pkg.name %>.min.css': [
                        'public/front/css/bootstrap.css',
                        'public/front/css/style.css',
                        'public/front/css/responsive.css',
                        'public/front/css/custom-style.css',
                        'public/front/css/font-awesome.css',
                        'public/front/css/angular-notify.min.css',
                        'public/front/css/owl.carousel.css'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);

};
