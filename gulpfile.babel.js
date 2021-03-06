import gulp from 'gulp';
import webpack from 'webpack';
import chalk from 'chalk';
import rimraf from 'rimraf';
//Server
import {create as createServerConfig} from './webpack.server';
//Client
import {create as createClientConfig} from './webpack.client';

//Allows to load all the plugins through $
const $ = require('gulp-load-plugins')();

// ----------------------------------------------------------
//Public Tasks
//rimraf will remove the build directories
gulp.task('clean:server', cb => rimraf('./build', cb));
gulp.task('clean:client', cb => rimraf('./public/build', cb));
gulp.task('clean', gulp.parallel('clean:server', 'clean:client'));

gulp.task('dev:server', gulp.series('clean:server', devServerBuild));
gulp.task('prod:server', gulp.series('clean:server', prodServerBuild));

gulp.task('prod:client', gulp.series('clean:client', prodClientBuild));

gulp.task('dev', gulp.series('clean', devServerBuild, gulp.parallel(devServerWatch, devServerReload)));
gulp.task('prod', gulp.series('clean', gulp.parallel(prodServerBuild, prodClientBuild)));

// ----------------------------------------------------------
//Private Client Tasks

function prodClientBuild(callback) {
    const prodClientWebpack = webpack(createClientConfig(false));
    prodClientWebpack.run((error, stats) => {
       outputWebpack('Prod:Client', error, stats);
        callback();
    });
}

// ----------------------------------------------------------
//Private Server Tasks

//Create webpack dev instance
const devServerWebpack = webpack(createServerConfig(true));
//Create webpack prod instance
const prodServerWebpack = webpack(createServerConfig(false));

function devServerBuild(callback) {
    //Run webpack instance
    devServerWebpack.run((error, stats) => {
        outputWebpack('Dev:Server', error, stats);
        //Callback is being passed by Gulp, this tells gulp when the task is finished
        callback();
    });
}

function devServerWatch() {
    devServerWebpack.watch({}, (error, stats) => {
        outputWebpack('Dev:Server', error, stats);
    });
}

function devServerReload() {
    return $.nodemon({
        script: './build/server.js',
        watch: './build',
        env: {
            'NODE_ENV': 'development',
            'USE_WEBPACK': 'true'
        }
    });
}

function prodServerBuild(callback) {
    prodServerWebpack.run((error, stats) => {
       outputWebpack('Prod:Server', error, stats);
        callback();
    });

}

// ----------------------------------------------------------
//Helpers

function outputWebpack(label, error, stats) {
    //Check for configuration errors
    if(error){
        throw new Error(error);
    }
    //Check for all other errors
    if(stats.hasErrors()){
        $.util.log(stats.toString({colors: true}));
    } else {
        const time = stats.endTime - stats.startTime;
        $.util.log(chalk.white.bgGreen(`Build ${label} in ${time} ms.`));
    }
}